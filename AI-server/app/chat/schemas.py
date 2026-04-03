"""定义聊天业务对外暴露的数据结构。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryMessage(BaseModel):
    """描述一次会话内的历史对话消息。"""

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    """Node 发给 Python 的流式聊天请求体。"""

    query: str = Field(min_length=1)
    sessionId: str | None = None
    userId: str
    recentMessages: list[ChatHistoryMessage] = Field(default_factory=list)


class ChatSource(BaseModel):
    """返回给 Node/前端的引用信息。"""

    fileId: str | None = None
    fileName: str | None = None
    pageNumber: int | None = None
    chunkIndex: int | None = None
    snippet: str


class ChatStreamEvent(BaseModel):
    """统一的聊天流事件。"""

    type: Literal[
        "message.started",
        "message.delta",
        "message.sources",
        "message.completed",
        "message.failed",
    ]
    delta: str | None = None
    sources: list[ChatSource] = Field(default_factory=list)
    message: str | None = None
    code: str | None = None