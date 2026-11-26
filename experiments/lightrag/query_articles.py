"""Inspect retrieved evidence from the existing six-article LightRAG index."""

import argparse
import asyncio
import json
from functools import partial

from lightrag import LightRAG, QueryParam
from lightrag.llm.ollama import ollama_embed, ollama_model_complete
from lightrag.utils import EmbeddingFunc

from config import DATA_PATH, EMBEDDING_MODEL, LLM_MODEL, OLLAMA_URL, storage_path


async def search(question: str, mode: str):
    storage = storage_path(DATA_PATH.read_bytes())
    source_map = storage / "source_map.json"
    if not source_map.is_file():
        raise SystemExit("Chưa có chỉ mục cho bộ dữ liệu hiện tại. Chạy index_articles.py trước.")
    with source_map.open(encoding="utf-8") as file:
        sources = json.load(file)

    rag = LightRAG(
        working_dir=str(storage),
        llm_model_func=ollama_model_complete,
        llm_model_name=LLM_MODEL,
        llm_model_max_async=1,
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
        result = await rag.aquery_data(
            question,
            param=QueryParam(mode=mode, top_k=5, chunk_top_k=3, enable_rerank=False),
        )
    finally:
        await rag.finalize_storages()

    data = result.get("data") or {}
    chunks = data.get("chunks", [])
    print(f"\nCâu hỏi: {question}")
    print(f"Chế độ: {mode} | Trạng thái: {result.get('status')}")
    print(f"Node tìm thấy: {len(data.get('entities', []))}")
    print(f"Cạnh tìm thấy: {len(data.get('relationships', []))}")
    print(f"Đoạn luật tìm thấy: {len(chunks)}")
    if not chunks:
        print(result.get("message", "Không có đoạn luật trong kết quả."))

    for rank, chunk in enumerate(chunks, start=1):
        unit_id = chunk.get("file_path")
        source = sources.get(unit_id)
        if source is None:
            print(f"\n{rank}. Chưa ánh xạ được nguồn: {unit_id}")
        else:
            print(
                f"\n{rank}. Điều {source['article_number']} | "
                f"trang PDF {source['pdf_page_start']}–{source['pdf_page_end']}"
            )
        print(chunk["content"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("naive", "hybrid", "mix"), default="naive")
    args = parser.parse_args()
    question = input("Nhập câu hỏi: ").strip()
    if not question:
        parser.error("Câu hỏi đang trống.")
    asyncio.run(search(question, args.mode))
