"""Run live answer regressions, including an unseen phrasing of OUT05."""

from argparse import ArgumentParser
import json
from pathlib import Path
from urllib.parse import quote

import httpx


CASES_PATH = Path(__file__).resolve().parents[1] / "data" / "eval" / "retrieval_cases.jsonl"


def main():
    parser = ArgumentParser()
    parser.add_argument("--api-base-url", default="http://127.0.0.1:8001")
    parser.add_argument("--case", choices=["IN06", "IN10", "OUT01", "OUT05", "OUT06"])
    args = parser.parse_args()
    queries = {}
    for line in CASES_PATH.read_text(encoding="utf-8").splitlines():
        if line.strip():
            case = json.loads(line)
            queries[case["id"]] = case["query"]
    queries["OUT06"] = "Tôi đã qua thử việc, hiện làm theo hợp đồng lao động 12 tháng. Nếu tự xin nghỉ thì phải báo trước mấy ngày?"
    expected = {
        "IN06": ("26", (12, 12)),
        "IN10": ("14", (7, 7)),
        "OUT01": (None, None),
        "OUT05": (None, None),
        "OUT06": (None, None),
    }
    failures = 0
    with httpx.Client(base_url=args.api_base_url.rstrip("/"), timeout=300, trust_env=False) as client:
        health_response = client.get("/health")
        health_response.raise_for_status()
        health = health_response.json()
        if health.get("mode") != "b" or health.get("retrieval_ready") is not True:
            raise RuntimeError("Start the API with RETRIEVAL_MODE=b and the six-article corpus.")
        snapshot = health["snapshot_id"]
        for case_id, (article, pages) in expected.items():
            if args.case and case_id != args.case:
                continue
            try:
                response = client.post("/api/v1/answer", json={"query": queries[case_id]})
                response.raise_for_status()
                result = response.json()
                print(f"\n{case_id} | {queries[case_id]}")
                print(json.dumps(result, ensure_ascii=False, indent=2))
                assert result["snapshot_id"] == snapshot, "The data snapshot changed during evaluation."
                assert isinstance(result["answer"], str) and result["answer"].strip(), "The answer is empty."
                if article is None:
                    assert result["status"] == "insufficient_evidence", "An out-of-scope question was answered."
                    assert result["citations"] == [], "An abstention contains citations."
                else:
                    assert result["status"] == "answered", "An answerable question was rejected."
                    citations = result["citations"]
                    assert any(row["article"] == article for row in citations), "The expected source is missing."
                    expected_source = next(row for row in citations if row["article"] == article)
                    assert (expected_source["page_from"], expected_source["page_to"]) == pages, "The PDF page range is wrong."
                    for row in citations:
                        source_response = client.get("/api/v1/sources/" + quote(row["unit_id"], safe=""))
                        source_response.raise_for_status()
                        opened = source_response.json()
                        assert opened["snapshot_id"] == snapshot and opened["source"] == row, "The citation differs from the source endpoint."
                print(f"PASS | {case_id} | response and source assertions")
            except (AssertionError, httpx.HTTPError, KeyError, TypeError, ValueError) as error:
                failures += 1
                print(f"FAIL | {case_id} | {error}")
        if failures:
            raise SystemExit(f"Failed cases: {failures}")
    print("\nAPI assertions passed. Read each answer and source to check legal meaning and applicability.")


if __name__ == "__main__":
    main()
