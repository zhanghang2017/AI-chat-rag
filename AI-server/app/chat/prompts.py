"""封装聊天业务中的 prompt 与消息组装。"""

from __future__ import annotations

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from app.chat.schemas import ChatRequest, ChatSource
from app.config import settings


def build_system_prompt(sources: list[ChatSource]) -> str:
    """将检索结果格式化为系统提示词。"""

    context_lines = []
    for index, source in enumerate(sources, start=1):
        label = source.fileName or source.fileId or f"source-{index}"
        page_label = f" page {source.pageNumber}" if source.pageNumber is not None else ""
        context_lines.append(f"[{index}] {label}{page_label}: {source.snippet}")

    context_block = "\n".join(context_lines) if context_lines else "No relevant knowledge base passages were retrieved."

    return (
        "You are the chat assistant for a private knowledge base. "
        "Answer using the provided knowledge base context when possible. "
        "If the context is empty or insufficient, say that the knowledge base does not contain enough information. "
        "Do not invent file names or claims. Keep answers concise but useful.\n\n"
        f"Knowledge Base Context:\n{context_block}"
    )


def build_llm_messages(payload: ChatRequest, sources: list[ChatSource]) -> list[BaseMessage]:
    """将会话上下文和检索结果转换为 LangChain 消息列表。"""

    messages: list[BaseMessage] = [SystemMessage(content=build_system_prompt(sources))]

    for message in payload.recentMessages[-settings.chat_context_message_limit:]:
        if message.role == "assistant":
            messages.append(AIMessage(content=message.content))
            continue

        messages.append(HumanMessage(content=message.content))

    if not payload.recentMessages or payload.recentMessages[-1].content != payload.query:
        messages.append(HumanMessage(content=payload.query))

    return messages