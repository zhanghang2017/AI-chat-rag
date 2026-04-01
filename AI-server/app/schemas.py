from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["queued", "running", "success", "failed", "cancelled"]


class IngestionJob(BaseModel):
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
    chunkIndex: int = Field(ge=0)
    vectorId: str
    chunkHash: str
    contentPreview: str
    pageNumber: int | None = None


class IngestionChunkSyncPayload(BaseModel):
    taskId: str
    fileId: str
    userId: str
    collectionName: str
    parseVersion: int = Field(default=1, ge=1)
    chunks: list[ChunkPayload]


class IngestionCallbackPayload(BaseModel):
    taskId: str
    fileId: str
    status: TaskStatus
    progress: float = Field(ge=0, le=100)
    chunkCount: int | None = Field(default=None, ge=0)
    errorMessage: str | None = None
