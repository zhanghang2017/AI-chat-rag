"""封装知识库入库流程到 Node 元数据服务的 HTTP 回调。"""

from __future__ import annotations

import httpx

from app.config import settings
from app.knowledge_base.schemas import IngestionCallbackPayload, IngestionChunkSyncPayload


class KnowledgeIngestionCallbackClient:
    """负责将知识库入库状态和分块元数据回传给 Node 服务。"""

    def __init__(self) -> None:
        """准备带鉴权信息的通用请求头。"""

        self._headers = {"Content-Type": "application/json"}
        if settings.ai_service_secret:
            self._headers["x-ai-service-secret"] = settings.ai_service_secret

    async def send_status(self, payload: IngestionCallbackPayload) -> None:
        """向 Node 元数据服务回传知识库入库任务进度。"""

        async with httpx.AsyncClient(timeout=settings.callback_timeout_seconds) as client:
            response = await client.post(
                f"{settings.node_base_url}/ai/ingestion/callback",
                headers=self._headers,
                json=payload.model_dump(),
            )
            response.raise_for_status()

    async def sync_chunks(self, payload: IngestionChunkSyncPayload) -> None:
        """在向量写入成功后同步知识库分块元数据。"""

        async with httpx.AsyncClient(timeout=settings.callback_timeout_seconds) as client:
            response = await client.post(
                f"{settings.node_base_url}/ai/ingestion/chunks",
                headers=self._headers,
                json=payload.model_dump(),
            )
            response.raise_for_status()
