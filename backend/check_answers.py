"""Check answer failure handling with controlled Ollama responses."""

import json
import os
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.main import app


def main():
    settings = {"RETRIEVAL_MODE": "b", "OLLAMA_MODEL": "test-model"}
    with patch.dict(os.environ, settings), TestClient(app) as client:
        source = client.post("/api/v1/search", json={"query": "tiền lương thử việc", "top_k": 1}).json()["results"][0]
        generated = {"status": "answered", "answer": "Theo nguồn Điều 26, mức tối thiểu là 85%.",
                     "citation_ids": [source["unit_id"]]}

        def reply(body, done=True):
            return httpx.Response(200, json={"done": done, "response": json.dumps(body)},
                                  request=httpx.Request("POST", "http://ollama/api/generate"))

        with patch("app.answers.httpx.post", return_value=reply(generated)) as model:
            result = client.post("/api/v1/answer", json={"query": "tiền lương thử việc"})
            assert result.status_code == 200 and result.json()["citations"] == [source]
            assert model.call_args.kwargs["json"]["stream"] is False
            print("PASS model output maps to the exact retrieved source")
            model.reset_mock()
            result = client.post("/api/v1/answer", json={"query": "Mật khẩu wifi"})
            assert result.status_code == 200 and result.json()["status"] == "insufficient_evidence"
            model.assert_not_called()
            print("PASS no retrieved evidence returns before calling Ollama")

        for body, done in (
            ({**generated, "citation_ids": ["invented-source"]}, True),
            ({**generated, "citation_ids": []}, True),
            ({**generated, "status": "insufficient_evidence"}, True),
            ({**generated, "answer": ""}, True),
            (generated, False),
        ):
            with patch("app.answers.httpx.post", return_value=reply(body, done)):
                assert client.post("/api/v1/answer", json={"query": "tiền lương thử việc"}).status_code == 502
        print("PASS unknown citations, inconsistent statuses, empty and incomplete output rejected")
        with patch("app.answers.httpx.post", return_value=reply({
            "status": "insufficient_evidence", "answer": "Chưa đủ căn cứ.", "citation_ids": [],
        })):
            assert client.post("/api/v1/answer", json={"query": "tiền lương thử việc"}).json()["status"] == "insufficient_evidence"
        for error, code in ((httpx.ConnectError("offline"), 503), (httpx.ReadTimeout("slow"), 504)):
            with patch("app.answers.httpx.post", side_effect=error):
                assert client.post("/api/v1/answer", json={"query": "tiền lương thử việc"}).status_code == code
        with patch.dict(os.environ, {"OLLAMA_MODEL": ""}):
            assert client.post("/api/v1/answer", json={"query": "tiền lương thử việc"}).json()["detail"]["code"] == "answer_not_configured"
        assert client.post("/api/v1/answer", json={"query": " "}).status_code == 422
        print("PASS insufficient evidence, model failure, timeout, missing model and invalid input")


if __name__ == "__main__":
    main()
