
"""集中管理 AI-server 运行时配置。"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]


def _get_env_str(name: str, default: str) -> str:
    """读取字符串环境变量；当值为空时回退到默认值。"""

    value = os.getenv(name)
    if value is None:
        return default

    normalized = value.strip()
    return normalized or default



@dataclass(frozen=True)
class Settings:
    """从环境变量读取并冻结运行时配置。"""

    host: str = _get_env_str("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "8000"))
    node_base_url: str = _get_env_str("NODE_BASE_URL", "http://127.0.0.1:3001/v1")
    ai_service_secret: str = _get_env_str("AI_SERVICE_SHARED_SECRET", "")
    chroma_persist_directory: str = str(
        Path(_get_env_str("CHROMA_PERSIST_DIRECTORY", str(BASE_DIR / "ai_chroma"))).expanduser()
    )
    chroma_collection_name: str = _get_env_str(
        "CHROMA_COLLECTION_NAME", "knowledge_chunks"
    )
    zhipu_api_key: str = _get_env_str("ZHIPUAI_API_KEY", "")
    openai_api_key: str = _get_env_str("OPENAI_API_KEY", "")
    openai_base_url: str = _get_env_str("OPENAI_BASE_URL", "")
    openai_chat_model: str = _get_env_str("OPENAI_CHAT_MODEL", "")
    chat_retrieval_top_k: int = max(1, int(os.getenv("CHAT_RETRIEVAL_TOP_K", "5")))
    chat_context_message_limit: int = max(1, int(os.getenv("CHAT_CONTEXT_MESSAGE_LIMIT", "8")))
    chunk_size: int = int(os.getenv("INGEST_CHUNK_SIZE", "800"))
    chunk_overlap: int = int(os.getenv("INGEST_CHUNK_OVERLAP", "120"))
    embedding_batch_size: int = max(1, int(os.getenv("EMBEDDING_BATCH_SIZE", "64")))
    callback_timeout_seconds: float = float(
        os.getenv("NODE_CALLBACK_TIMEOUT_SECONDS", "10")
    )


# 在导入阶段完成一次配置解析，供各模块直接复用。
settings = Settings()
