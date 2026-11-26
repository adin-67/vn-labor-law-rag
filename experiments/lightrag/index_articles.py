"""Index the six Capstone labour-law articles in local LightRAG storage."""

import asyncio
import json
import xml.etree.ElementTree as ET
from functools import partial

from lightrag import LightRAG
from lightrag.llm.ollama import ollama_embed, ollama_model_complete
from lightrag.utils import EmbeddingFunc

from config import DATA_PATH, EMBEDDING_MODEL, LLM_MODEL, OLLAMA_URL, storage_path


EXPECTED_ARTICLES = {13, 14, 24, 25, 26, 27}


async def main():
    raw = DATA_PATH.read_bytes()
    rows = [json.loads(line) for line in raw.decode("utf-8-sig").splitlines() if line.strip()]
    if len(rows) != 6 or {row["article_number"] for row in rows} != EXPECTED_ARTICLES:
        raise ValueError(f"Expected exactly articles {sorted(EXPECTED_ARTICLES)} in {DATA_PATH}")
    source_map = {}
    for row in sorted(rows, key=lambda item: item["article_number"]):
        if row["document_id"] != "45/2019/QH14" or not row["text"].strip():
            raise ValueError(f"Invalid document or empty text for article {row['article_number']}")
        if row["pdf_page_start"] > row["pdf_page_end"]:
            raise ValueError(f"Invalid page range for article {row['article_number']}")
        source_map[f"45-2019-QH14-as-issued-2019-dieu-{row['article_number']}"] = row

    storage = storage_path(raw)
    storage.mkdir(exist_ok=True)
    print(f"Input: {DATA_PATH}\nStorage: {storage}", flush=True)

    rag = LightRAG(
        working_dir=str(storage),
        llm_model_func=ollama_model_complete,
        llm_model_name=LLM_MODEL,
        llm_model_max_async=1,
        max_parallel_insert=1,
        llm_model_kwargs={
            "host": OLLAMA_URL,
            "timeout": 300,
            "options": {
                "num_ctx": 8192,
                "num_predict": 4096,
                "temperature": 0,
                "think": False,
            },
        },
        embedding_func=EmbeddingFunc(
            embedding_dim=1024,
            max_token_size=8192,
            func=partial(
                ollama_embed.func,
                embed_model=EMBEDDING_MODEL,
                host=OLLAMA_URL,
                timeout=180,
            ),
        ),
        embedding_func_max_async=1,
        addon_params={"language": "Vietnamese"},
    )

    await rag.initialize_storages()
    try:
        await rag.ainsert(
            input=[row["text"] for row in source_map.values()],
            ids=list(source_map),
            file_paths=list(source_map),
        )
        counts = await rag.get_processing_status()
        print("Document status:", counts)
        if counts.get("processed", 0) != len(rows):
            raise RuntimeError("Check the LightRAG logs for articles that failed to process.")
    finally:
        await rag.finalize_storages()

    graph = ET.parse(storage / "graph_chunk_entity_relation.graphml")
    ns = {"g": "http://graphml.graphdrawing.org/xmlns"}
    nodes = graph.findall(".//g:node", ns)
    edges = graph.findall(".//g:edge", ns)
    print(f"Graph nodes: {len(nodes)}\nGraph edges: {len(edges)}")
    if not nodes or not edges:
        raise RuntimeError("The graph has no entities or relationships.")

    map_path = storage / "source_map.json"
    map_path.write_text(json.dumps(source_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Source map: {map_path}")
    print("PASS | Six articles processed and a non-empty graph saved")


if __name__ == "__main__":
    asyncio.run(main())
