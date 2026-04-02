"""封装知识库向量化模型的创建逻辑。"""

from __future__ import annotations

from langchain_community.embeddings import ZhipuAIEmbeddings

from app.config import settings


def create_embedding_model() -> ZhipuAIEmbeddings:
    """创建知识库文档向量化阶段使用的嵌入模型客户端。"""

    if not settings.zhipu_api_key:
        raise RuntimeError("ZHIPUAI_API_KEY is required for ingestion")

    return ZhipuAIEmbeddings(model="embedding-3", api_key=settings.zhipu_api_key)
