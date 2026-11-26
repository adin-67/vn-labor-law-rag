import hashlib
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parents[1] / "data" / "processed" / "45-2019-QH14-chunks.jsonl"
OLLAMA_URL = os.getenv("LIGHTRAG_OLLAMA_URL", "http://127.0.0.1:11434")
LLM_MODEL = "qwen3:4b-instruct-2507-q4_K_M"
EMBEDDING_MODEL = "bge-m3:latest"


def storage_path(raw: bytes) -> Path:
    snapshot = hashlib.sha256(raw).hexdigest()[:12]
    return BASE_DIR / f"storage_{snapshot}"
