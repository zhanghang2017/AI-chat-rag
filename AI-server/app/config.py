"""
Editor: zhanghang
Description:
Date: 2026-04-01 11:46:01
LastEditors: zhanghang
LastEditTime: 2026-04-01 11:46:23
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    """Runtime configuration resolved from environment variables."""

    node_base_url: str = os.getenv("NODE_BASE_URL", "http://127.0.0.1:3001/v1")
    ai_service_secret: str = os.getenv("AI_SERVICE_SHARED_SECRET", "")
    chroma_persist_directory: str = os.getenv(
        "CHROMA_PERSIST_DIRECTORY",
        str(BASE_DIR / "ai_chroma"),
    )
    chroma_collection_name: str = os.getenv(
        "CHROMA_COLLECTION_NAME", "knowledge_chunks"
    )
    zhipu_api_key: str = os.getenv("ZHIPUAI_API_KEY", "")
    chunk_size: int = int(os.getenv("INGEST_CHUNK_SIZE", "800"))
    chunk_overlap: int = int(os.getenv("INGEST_CHUNK_OVERLAP", "120"))
    embedding_batch_size: int = max(1, int(os.getenv("EMBEDDING_BATCH_SIZE", "64")))
    callback_timeout_seconds: float = float(
        os.getenv("NODE_CALLBACK_TIMEOUT_SECONDS", "10")
    )


settings = Settings()
