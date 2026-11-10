"""Expose the teammate's BM25 search through the FastAPI source contract."""

from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
import json
import os
from pathlib import Path


DEFAULT_REPO = Path(__file__).resolve().parents[2]
REPO = Path(os.environ.get("B_REPO_PATH") or DEFAULT_REPO).resolve()
SOURCE_URL = "https://congbao.chinhphu.vn/detail/tai-ve?id=30232&slug=45-2019-qh14"
VERSION_ID = "45-2019-QH14-as-issued-2019"

spec = spec_from_file_location("teammate_search_bm25", REPO / "scripts" / "search_bm25.py")
if spec is None or spec.loader is None:
    raise ImportError(f"Cannot load BM25 from {REPO}")
bm25 = module_from_spec(spec)
spec.loader.exec_module(bm25)

snapshot = bm25.CHUNKS_PATH.read_bytes()
SNAPSHOT_ID = f"bm25-24-27-{sha256(snapshot).hexdigest()[:16]}"


def source_from_chunk(chunk):
    if chunk["document_id"] != "45/2019/QH14":
        raise ValueError("Unexpected document in the BM25 sample")
    article = str(chunk["article_number"])
    return {
        "unit_id": f"{VERSION_ID}-dieu-{article}",
        "document_id": chunk["document_id"],
        "version_id": VERSION_ID,
        "title": f"Điều {article}. {chunk['article_title']}",
        "article": article,
        "text": chunk["text"],
        "page_from": chunk["pdf_page_start"],
        "page_to": chunk["pdf_page_end"],
        "source_url": SOURCE_URL,
    }


sources = {}
for line in snapshot.decode("utf-8").splitlines():
    if line.strip():
        source = source_from_chunk(json.loads(line))
        unit_id = source["unit_id"]
        if unit_id in sources:
            raise ValueError(f"Duplicate source ID: {unit_id}")
        sources[unit_id] = source
if not sources:
    raise ValueError("The BM25 sample contains no sources")


def search(query: str, top_k: int) -> list[dict]:
    results = [source_from_chunk(chunk) for chunk in bm25.search_articles(query, top_k)]
    if any(sources.get(result["unit_id"]) != result for result in results):
        raise ValueError("BM25 data changed. Restart the API to load the new snapshot.")
    return results


def get_source(unit_id: str) -> dict | None:
    return sources.get(unit_id)
