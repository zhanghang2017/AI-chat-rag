'''
Editor: zhanghang
Description: 
Date: 2026-04-01 11:46:23
LastEditors: zhanghang
LastEditTime: 2026-04-01 11:46:28
'''
from __future__ import annotations

from langchain_community.embeddings import ZhipuAIEmbeddings

from .config import settings


def get_embedding_model() -> ZhipuAIEmbeddings:
    """Create the embedding client used for document vectorization."""

    if not settings.zhipu_api_key:
        raise RuntimeError("ZHIPUAI_API_KEY is required for ingestion")

    return ZhipuAIEmbeddings(model="embedding-3", api_key=settings.zhipu_api_key)
