"""Run API contract/error checks without starting a server or using B's real code."""
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from types import ModuleType
import json
import os
import sys
from fastapi.testclient import TestClient
from app.main import app

checks = []


def check(name, condition):
    checks.append({"name": name, "passed": bool(condition)})
    if not condition:
        raise AssertionError(name)


@contextmanager
def environment(**values):
    original = {key: os.environ.get(key) for key in values}
    try:
        for key, value in values.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
        yield
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def main():
    with environment(RETRIEVAL_MODE="mock", MOCK_DATA_PATH=None), TestClient(app) as client:
        response = client.get("/health")
        check("API alive and fixtures available", response.status_code == 200 and response.json()["retrieval_ready"] is True)
        response = client.post("/api/v1/search", json={"query":"  Lương thử việc  "})
        payload = response.json()
        check("Search is marked mock and trims input", response.status_code == 200 and payload["mode"] == "mock" and payload["query"] == "Lương thử việc")
        check("Expected fixture ID returned", payload["results"][0]["unit_id"] == "mock-thu-viec")
        response = client.get("/api/v1/sources/mock-thu-viec")
        check("Source opens by the selected ID", response.status_code == 200 and response.json()["source"] == payload["results"][0])
        check("Unknown source is 404", client.get("/api/v1/sources/does-not-exist").status_code == 404)
        response = client.post("/api/v1/search", json={"query":"dự báo thời tiết"})
        check("No match is a valid empty result", response.status_code == 200 and response.json()["status"] == "no_results" and not response.json()["results"])
        for body in ({"query":"   "}, {"query":1}, {"query":"lương", "top_k":0}, {"query":"lương", "top_k":True}):
            check(f"Invalid input rejected: {body!r}", client.post("/api/v1/search", json=body).status_code == 422)
        response = client.post("/api/v1/search", json={"query":"thử việc và hợp đồng", "top_k":1})
        check("top_k caps result count", response.status_code == 200 and len(response.json()["results"]) == 1)
        response = client.options("/api/v1/search", headers={"Origin":"http://127.0.0.1:5173", "Access-Control-Request-Method":"POST", "Access-Control-Request-Headers":"content-type"})
        check("CORS allows the actual Vite origin", response.status_code == 200 and response.headers.get("access-control-allow-origin") == "http://127.0.0.1:5173")
        with environment(MOCK_DATA_PATH=str(Path(__file__).resolve().parent / "data" / "missing-for-check.json")):
            check("Health reports missing retrieval data", client.get("/health").json()["retrieval_ready"] is False)
            check("Missing data is 503, not empty success", client.post("/api/v1/search", json={"query":"lương"}).status_code == 503)
        with NamedTemporaryFile(mode="w", suffix=".json", encoding="utf-8", delete=False) as bad:
            bad.write("{invalid json")
            bad_name = bad.name
        try:
            with environment(MOCK_DATA_PATH=bad_name):
                check("Malformed fixture data is 503", client.post("/api/v1/search", json={"query":"lương"}).status_code == 503)
        finally:
            Path(bad_name).unlink()
        with environment(RETRIEVAL_MODE="b", B_ADAPTER_MODULE="app.not_implemented_yet"):
            check("Unavailable B adapter never falls back to mock", client.post("/api/v1/search", json={"query":"lương"}).status_code == 503)
        sample = payload["results"][0]
        fake = ModuleType("test_only_b_contract")
        fake.SNAPSHOT_ID = "test-double-only"
        fake.search = lambda query, top_k: [sample]
        fake.get_source = lambda unit_id: sample if unit_id == sample["unit_id"] else None
        sys.modules[fake.__name__] = fake
        try:
            with environment(RETRIEVAL_MODE="b", B_ADAPTER_MODULE=fake.__name__):
                check("B wrapper accepts a conforming TEST DOUBLE", client.post("/api/v1/search", json={"query":"lương"}).status_code == 200)
                fake.search = lambda query, top_k: {"not":"a list"}
                check("Malformed B response is 502", client.post("/api/v1/search", json={"query":"lương"}).status_code == 502)
                fake.get_source = lambda unit_id: {**sample, "unit_id":"wrong"}
                check("Wrong source ID from B is 502", client.get("/api/v1/sources/mock-thu-viec").status_code == 502)
        finally:
            sys.modules.pop(fake.__name__, None)
    report = {"date":"2026-11-06", "checks":checks,
              "limits":["Uses TestClient, not a browser end-to-end run", "B adapter checked with a test double, not B's real implementation", "No legal content, BM25, LightRAG, model or authentication quality measured"]}
    report_path = Path(__file__).resolve().with_name("API_CHECK_RESULTS.json")
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"PASS: {len(checks)} API checks. This is not a test of real retrieval or AI quality.")


if __name__ == "__main__":
    main()
