"""封装聊天业务中的 LLM 客户端创建逻辑。"""

from __future__ import annotations

from langchain_openai import ChatOpenAI

from app.config import settings


def create_chat_llm() -> ChatOpenAI:
    """创建聊天业务使用的 LangChain ChatOpenAI 客户端。"""

    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for chat")

    return ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=0.2,
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )