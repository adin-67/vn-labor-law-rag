"""Check evidence validation using real BM25 data and controlled model responses."""

import json
import os
import unicodedata
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException

from app.answers import generate_answer, normalize_excerpt
from app.main import answer
from app.retrieval import get_retriever
from app.schemas import AnswerRequest
from check_answers_live import check_expected_content


def model_response(body, *, done=True, done_reason="stop"):
    return httpx.Response(
        200,
        json={"done": done, "done_reason": done_reason, "response": json.dumps(body)},
        request=httpx.Request("POST", "http://ollama/api/generate"),
    )


class AnswerChecks(unittest.TestCase):
    def setUp(self):
        settings = {
            "RETRIEVAL_MODE": "b",
            "B_ADAPTER_MODULE": "app.b_integration",
            "OLLAMA_MODEL": "test-model",
            "OLLAMA_REVIEW_MODEL": "",
            "OLLAMA_BASE_URL": "http://127.0.0.1:11436",
        }
        environment = patch.dict(os.environ, settings)
        environment.start()
        self.addCleanup(environment.stop)
        self.retriever = get_retriever()
        self.snapshot = self.retriever.snapshot_id
        self.sources = {
            source.article: source
            for source in self.retriever.search("thử việc hợp đồng lao động", 10)
        }
        self.wage_source = self.sources["26"]
        self.wage_claim = {
            "text": "Điều 26 quy định mức tối thiểu là 85% mức lương của công việc đó.",
            "evidence": [{"unit_id": self.wage_source.unit_id, "quote": self.wage_source.text}],
        }
        self.draft = {"status": "answered", "claims": [self.wage_claim]}
        self.review = {
            "supported_claims": [True],
            "scope_matches": True,
            "fully_answers_question": True,
            "document_identity_correct": True,
        }

    def generate(self, query="Lúc thử việc được trả bao nhiêu phần trăm lương?", sources=None):
        return generate_answer(
            query,
            sources if sources is not None else list(self.sources.values()),
            self.snapshot,
        )

    def test_valid_answer_keeps_exact_source_metadata(self):
        with patch("app.answers.httpx.post", side_effect=[
            model_response(self.draft), model_response(self.review),
        ]) as model:
            result = self.generate()
        self.assertEqual(result.status, "answered")
        self.assertEqual(result.answer, self.wage_claim["text"])
        self.assertEqual(result.citations, [self.wage_source])
        self.assertEqual(result.snapshot_id, self.snapshot)
        self.assertEqual(model.call_count, 2)
        for call in model.call_args_list:
            self.assertFalse(call.kwargs["json"]["stream"])
            data = json.loads(call.kwargs["json"]["prompt"])["data"]
            self.assertTrue(all("Bộ luật Lao động" in row["document_title"] for row in data["sources"]))

    def test_electronic_contract_remains_answerable(self):
        source = self.sources["14"]
        draft = {"status": "answered", "claims": [{
            "text": "Theo khoản 1 Điều 14, hình thức điện tử có giá trị tương đương khi đáp ứng điều kiện về thông điệp dữ liệu.",
            "evidence": [{"unit_id": source.unit_id, "quote": source.text}],
        }]}
        with patch("app.answers.httpx.post", side_effect=[model_response(draft), model_response(self.review)]):
            result = self.generate("Hợp đồng lao động điện tử có giá trị như văn bản không?")
        self.assertEqual(result.status, "answered")
        self.assertEqual([(row.article, row.page_from, row.page_to) for row in result.citations], [("14", 7, 7)])

    def test_in06_can_use_second_ranked_source_through_answer_endpoint(self):
        query = "Lúc thử việc được trả bao nhiêu phần trăm lương?"
        retrieved = self.retriever.search(query, 3)
        self.assertEqual([source.article for source in retrieved], ["13", "26", "25"])
        with patch("app.answers.httpx.post", side_effect=[
            model_response(self.draft), model_response(self.review),
        ]) as model:
            result = answer(AnswerRequest(query=query))
        self.assertEqual(result.citations, [self.wage_source])
        data = json.loads(model.call_args_list[0].kwargs["json"]["prompt"])["data"]
        self.assertEqual([row["unit_id"] for row in data["sources"]], [row.unit_id for row in retrieved])

    def test_normalized_quotes_accept_pdf_line_breaks_and_unicode(self):
        quote = unicodedata.normalize("NFD", normalize_excerpt(self.wage_source.text))
        draft = {"status": "answered", "claims": [{**self.wage_claim, "evidence": [
            {"unit_id": self.wage_source.unit_id, "quote": quote},
        ]}]}
        with patch("app.answers.httpx.post", side_effect=[model_response(draft), model_response(self.review)]):
            self.assertEqual(self.generate().status, "answered")

    def test_repeated_evidence_produces_one_citation(self):
        draft = {"status": "answered", "claims": [self.wage_claim, self.wage_claim]}
        review = {**self.review, "supported_claims": [True, True]}
        with patch("app.answers.httpx.post", side_effect=[model_response(draft), model_response(review)]):
            self.assertEqual(self.generate().citations, [self.wage_source])

    def test_wifi_returns_before_model_call(self):
        with patch("app.answers.httpx.post") as model:
            result = answer(AnswerRequest(query="Mật khẩu wifi"))
        self.assertEqual(result.status, "insufficient_evidence")
        self.assertEqual(result.citations, [])
        model.assert_not_called()

    def test_model_abstention_returns_fixed_message(self):
        with patch("app.answers.httpx.post", return_value=model_response({
            "status": "insufficient_evidence", "claims": [],
        })) as model:
            result = self.generate()
        self.assertEqual(result.status, "insufficient_evidence")
        self.assertEqual(result.citations, [])
        self.assertEqual(model.call_count, 1)

    def test_fabricated_quote_and_unknown_id_are_rejected_before_review(self):
        invalid_evidence = [
            {"unit_id": self.wage_source.unit_id, "quote": "Người lao động luôn được hưởng toàn bộ mức lương."},
            {"unit_id": "invented-source", "quote": self.wage_source.text},
        ]
        for evidence in invalid_evidence:
            with self.subTest(evidence=evidence):
                draft = {"status": "answered", "claims": [{**self.wage_claim, "evidence": [evidence]}]}
                with patch("app.answers.httpx.post", return_value=model_response(draft)) as model:
                    with self.assertRaises(HTTPException) as error:
                        self.generate()
                self.assertEqual(error.exception.status_code, 502)
                self.assertEqual(error.exception.detail["code"], "invalid_evidence")
                self.assertEqual(model.call_count, 1)

    def test_after_probation_claim_is_withheld_when_review_finds_scope_mismatch(self):
        source = self.sources["27"]
        draft = {"status": "answered", "claims": [{
            "text": "Sau khi đã hết thử việc, người lao động có thể xin nghỉ mà không cần báo trước.",
            "evidence": [{"unit_id": source.unit_id, "quote": source.text}],
        }]}
        queries = [
            "Tôi đã hết thử việc và đang làm theo hợp đồng có thời hạn. Nếu xin nghỉ thì phải báo trước bao nhiêu ngày?",
            "Tôi đã qua thử việc, hiện làm theo hợp đồng lao động 12 tháng. Nếu tự xin nghỉ thì phải báo trước mấy ngày?",
        ]
        for query in queries:
            with self.subTest(query=query):
                with patch("app.answers.httpx.post", side_effect=[
                    model_response(draft), model_response({**self.review, "scope_matches": False}),
                ]):
                    result = self.generate(query)
                self.assertEqual(result.status, "insufficient_evidence")
                self.assertEqual(result.citations, [])
                self.assertNotIn("không cần báo trước", result.answer)

    def test_each_review_requirement_is_enforced(self):
        failures = [
            {"supported_claims": [False]},
            {"scope_matches": False},
            {"fully_answers_question": False},
            {"document_identity_correct": False},
        ]
        for failure in failures:
            with self.subTest(failure=failure):
                with patch("app.answers.httpx.post", side_effect=[
                    model_response(self.draft), model_response({**self.review, **failure}),
                ]):
                    result = self.generate()
                self.assertEqual(result.status, "insufficient_evidence")
                self.assertEqual(result.citations, [])

    def test_wrong_document_name_is_withheld_after_identity_review(self):
        source = self.sources["27"]
        draft = {"status": "answered", "claims": [{
            "text": "Theo Điều 27 của Nghị định 45/2019/QH14, người lao động có thể nghỉ mà không cần báo trước.",
            "evidence": [{"unit_id": source.unit_id, "quote": source.text}],
        }]}
        with patch("app.answers.httpx.post", side_effect=[
            model_response(draft), model_response({**self.review, "document_identity_correct": False}),
        ]):
            result = self.generate()
        self.assertEqual(result.status, "insufficient_evidence")
        self.assertEqual(result.citations, [])

    def test_review_must_cover_every_claim_and_use_booleans(self):
        reviews = [
            {**self.review, "supported_claims": [True, True]},
            {**self.review, "supported_claims": ["false"]},
            {**self.review, "scope_matches": "true"},
        ]
        for review in reviews:
            with self.subTest(review=review):
                with patch("app.answers.httpx.post", side_effect=[model_response(self.draft), model_response(review)]):
                    with self.assertRaises(HTTPException) as error:
                        self.generate()
                self.assertEqual(error.exception.status_code, 502)

    def test_invalid_and_incomplete_generation_is_rejected(self):
        bodies = [
            model_response({"status": "answered", "claims": []}),
            model_response({"status": "insufficient_evidence", "claims": [self.wage_claim]}),
            model_response({"status": "answered", "claims": [{**self.wage_claim, "text": "  "}]}),
            model_response(self.draft, done=False),
            model_response(self.draft, done_reason="length"),
            httpx.Response(
                200,
                json={"done": True, "response": "{"},
                request=httpx.Request("POST", "http://ollama/api/generate"),
            ),
        ]
        for response in bodies:
            with self.subTest(response=response):
                with patch("app.answers.httpx.post", return_value=response):
                    with self.assertRaises(HTTPException) as error:
                        self.generate()
                self.assertEqual(error.exception.status_code, 502)

    def test_model_errors_remain_distinct_from_missing_evidence(self):
        errors = [(httpx.ConnectError("offline"), 503), (httpx.ReadTimeout("slow"), 504)]
        for model_error, expected_status in errors:
            for stage in ("generation", "review"):
                with self.subTest(stage=stage, error=type(model_error).__name__):
                    sequence = [model_error] if stage == "generation" else [model_response(self.draft), model_error]
                    with patch("app.answers.httpx.post", side_effect=sequence):
                        with self.assertRaises(HTTPException) as error:
                            self.generate()
                    self.assertEqual(error.exception.status_code, expected_status)

    def test_empty_sources_and_missing_configuration(self):
        with patch.dict(os.environ, {"OLLAMA_MODEL": ""}), patch("app.answers.httpx.post") as model:
            self.assertEqual(self.generate(sources=[]).status, "insufficient_evidence")
            with self.assertRaises(HTTPException) as error:
                self.generate()
        self.assertEqual(error.exception.detail["code"], "answer_not_configured")
        model.assert_not_called()

    def test_optional_review_model_is_used_only_for_review(self):
        with patch.dict(os.environ, {"OLLAMA_REVIEW_MODEL": "review-model"}):
            with patch("app.answers.httpx.post", side_effect=[
                model_response(self.draft), model_response(self.review),
            ]) as model:
                self.generate()
        self.assertEqual([call.kwargs["json"]["model"] for call in model.call_args_list], ["test-model", "review-model"])

    def test_live_benchmark_catches_missing_wage_and_wrong_document_name(self):
        failures = [
            ("IN06", "Người lao động và người sử dụng lao động thỏa thuận tiền lương trong thời gian thử việc."),
            ("IN06", "Theo Nghị định 45/2019/QH14, tiền lương thử việc ít nhất bằng 85% mức lương của công việc đó."),
            ("IN06", "Lương thử việc bằng 85% mức lương của công việc đó."),
            ("IN10", "Hợp đồng điện tử luôn có giá trị như hợp đồng bằng văn bản."),
        ]
        for case_id, text in failures:
            with self.subTest(case_id=case_id, answer=text):
                with self.assertRaises(AssertionError):
                    check_expected_content(case_id, text)

    def test_live_benchmark_accepts_minimum_supported_contents(self):
        check_expected_content("IN06", "Lương thử việc phải đạt tối thiểu 85 % mức lương của công việc đó.")
        check_expected_content("IN10", "Theo khoản 1 Điều 14, hợp đồng điện tử có giá trị tương đương khi là thông điệp dữ liệu đáp ứng quy định pháp luật.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
