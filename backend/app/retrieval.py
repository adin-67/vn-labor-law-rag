"""Boundary to replace on Tuesday. Mock keyword matching is NOT BM25 or AI."""
from pathlib import Path
import importlib
import json
import os
import unicodedata
from .schemas import Source


class RetrievalUnavailable(Exception):
    pass


class InvalidRetrievalData(Exception):
    pass


def normalize(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text.casefold())
                   if unicodedata.category(c) != "Mn").replace("đ", "d")


class MockRetriever:
    mode = "mock"
    snapshot_id = "mock-fixtures-v1"

    def __init__(self):
        filename = Path(os.environ.get("MOCK_DATA_PATH", str(Path(__file__).resolve().parents[1] / "data" / "mock_sources.json")))
        try:
            rows = json.loads(filename.read_text(encoding="utf-8"))
            if not isinstance(rows, list):
                raise ValueError("Expected a list")
            self.rows = [(tuple(row["keywords"]), Source.model_validate(row["source"])) for row in rows]
            ids = [source.unit_id for _, source in self.rows]
            if len(ids) != len(set(ids)):
                raise ValueError("Duplicate unit IDs")
        except FileNotFoundError as error:
            raise RetrievalUnavailable("Không tìm thấy file dữ liệu mẫu.") from error
        except (OSError, ValueError, KeyError, TypeError) as error:
            raise InvalidRetrievalData("File dữ liệu mẫu chưa đúng định dạng.") from error

    def search(self, query: str, top_k: int) -> list[Source]:
        normalized = normalize(query)
        return [source for words, source in self.rows
                if any(normalize(word) in normalized for word in words)][:top_k]

    def get_source(self, unit_id: str) -> Source | None:
        return next((source for _, source in self.rows if source.unit_id == unit_id), None)


class BAdapter:
    mode = "b"

    def __init__(self):
        # The API will NOT silently fall back to fixtures when B is unavailable.
        module_name = os.environ.get("B_ADAPTER_MODULE", "app.b_integration")
        try:
            self.module = importlib.import_module(module_name)
            if not callable(getattr(self.module, "search", None)) or not callable(getattr(self.module, "get_source", None)):
                raise ValueError("Missing adapter functions")
            self.snapshot_id = self.module.SNAPSHOT_ID
            if not isinstance(self.snapshot_id, str) or not self.snapshot_id.strip():
                raise ValueError("Missing snapshot ID")
        except Exception as error:
            raise RetrievalUnavailable("Phần tích hợp tìm kiếm của B chưa sẵn sàng.") from error

    def search(self, query: str, top_k: int) -> list[Source]:
        try:
            rows = self.module.search(query=query, top_k=top_k)
            if not isinstance(rows, list):
                raise ValueError("Expected list")
            results = [Source.model_validate(row) for row in rows]
            ids = [source.unit_id for source in results]
            if len(ids) != len(set(ids)):
                raise ValueError("Duplicate unit IDs")
            return results[:top_k]
        except FileNotFoundError as error:
            raise RetrievalUnavailable("Dữ liệu tìm kiếm của B chưa sẵn sàng.") from error
        except Exception as error:
            raise InvalidRetrievalData("Kết quả tìm kiếm chưa đúng hợp đồng tích hợp.") from error

    def get_source(self, unit_id: str) -> Source | None:
        try:
            row = self.module.get_source(unit_id=unit_id)
            source = None if row is None else Source.model_validate(row)
            if source is not None and source.unit_id != unit_id:
                raise ValueError("Source ID mismatch")
            return source
        except FileNotFoundError as error:
            raise RetrievalUnavailable("Kho nguồn của B chưa sẵn sàng.") from error
        except Exception as error:
            raise InvalidRetrievalData("Nguồn trả về chưa đúng hợp đồng tích hợp.") from error


def get_retriever():
    mode = os.environ.get("RETRIEVAL_MODE", "mock")
    if mode == "mock":
        return MockRetriever()
    if mode == "b":
        return BAdapter()
    raise RetrievalUnavailable("RETRIEVAL_MODE phải là mock hoặc b.")
