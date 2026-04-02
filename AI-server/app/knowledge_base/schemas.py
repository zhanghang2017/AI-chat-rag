"""定义知识库入库流程与上游服务之间共享的数据结构。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# 入库任务在 AI-server 与 Node 服务之间共享的状态枚举。
TaskStatus = Literal["queued", "running", "success", "failed", "cancelled"]


class IngestionJob(BaseModel):
    """描述一次知识库文件入库任务的输入负载。"""

    taskId: str
    fileId: str
    userId: str
    fileName: str
    fileExt: str
    fileSizeBytes: int = Field(gt=0)
    contentMd5: str
    storagePath: str
    absoluteFilePath: str
    parseVersion: int = Field(default=1, ge=1)


class ChunkPayload(BaseModel):
    """描述单个知识库文本分块在 Node 侧需要保存的元数据。"""

    chunkIndex: int = Field(ge=0)
    vectorId: str
    chunkHash: str
    contentPreview: str
    pageNumber: int | None = None


class IngestionChunkSyncPayload(BaseModel):
    """用于批量同步知识库分块元数据的请求体。"""

    taskId: str
    fileId: str
    userId: str
    collectionName: str
    parseVersion: int = Field(default=1, ge=1)
    chunks: list[ChunkPayload]


class IngestionCallbackPayload(BaseModel):
    """用于回传知识库入库进度和最终状态的回调请求体。"""

    taskId: str
    fileId: str
    status: TaskStatus
    progress: float = Field(ge=0, le=100)
    chunkCount: int | None = Field(default=None, ge=0)
    errorMessage: str | None = None
