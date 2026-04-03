"""封装聊天业务中的 RAG 检索、Prompt 组装与流式输出。"""

from __future__ import annotations

import json
from collections.abc import Iterable

from app.chat.llm import create_chat_llm
from app.chat.prompts import build_llm_messages
from app.chat.retriever import build_chat_sources
from app.chat.schemas import ChatRequest, ChatStreamEvent


def _sse(event: str, payload: dict[str, object]) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _coerce_chunk_text(content: object) -> str:
    """将 LangChain/OpenAI 返回的 chunk 内容统一转成可流式输出的纯文本。"""

    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue

            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                    continue

                nested_text = item.get("content")
                if isinstance(nested_text, str):
                    parts.append(nested_text)

        return "".join(parts)

    return str(content)


def stream_chat_events(payload: ChatRequest) -> Iterable[str]:
    """将检索增强聊天响应格式化为 SSE 事件流。"""

    yield _sse("message.started", ChatStreamEvent(type="message.started").model_dump())

    try:
        sources = build_chat_sources(payload)
        client = create_chat_llm()
        response = client.stream(build_llm_messages(payload, sources))

        for chunk in response:
            content = _coerce_chunk_text(chunk.content)
            if not content:
                continue

            yield _sse(
                "message.delta",
                ChatStreamEvent(type="message.delta", delta=content).model_dump(exclude_none=True),
            )

        yield _sse(
            "message.sources",
            ChatStreamEvent(type="message.sources", sources=sources).model_dump(exclude_none=True),
        )
        yield _sse(
            "message.completed",
            ChatStreamEvent(type="message.completed").model_dump(exclude_none=True),
        )
    except Exception as error:  # noqa: BLE001
        yield _sse(
            "message.failed",
            ChatStreamEvent(
                type="message.failed",
                code="AI_CHAT_FAILED",
                message=str(error),
            ).model_dump(exclude_none=True),
        )