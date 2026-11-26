import asyncio
from importlib.metadata import version

import numpy as np
from lightrag.llm.ollama import ollama_embed

from config import EMBEDDING_MODEL, OLLAMA_URL

TEXTS = [
    "Tiền lương trong thời gian thử việc.",
    "Hình thức giao kết hợp đồng lao động.",
]


async def main():
    print(f"LightRAG: {version('lightrag-hku')}")
    print(f"Embedding model: {EMBEDDING_MODEL}")
    print("Creating embeddings...", flush=True)

    vectors = await ollama_embed(
        TEXTS,
        embed_model=EMBEDDING_MODEL,
        host=OLLAMA_URL,
        timeout=180,
    )

    expected_shape = (len(TEXTS), 1024)

    if vectors.shape != expected_shape:
        raise ValueError(
            f"Expected shape {expected_shape}, got {vectors.shape}"
        )

    if not np.isfinite(vectors).all():
        raise ValueError("Embedding contains invalid numbers")

    if (np.linalg.norm(vectors, axis=1) == 0).any():
        raise ValueError("Embedding contains a zero vector")

    print(f"Vector shape: {vectors.shape}")
    print("PASS | LightRAG can request embeddings from Ollama")


if __name__ == "__main__":
    asyncio.run(main())
