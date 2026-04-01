'''
Editor: zhanghang
Description: 
Date: 2026-04-01 11:47:04
LastEditors: zhanghang
LastEditTime: 2026-04-01 17:57:17
'''
from __future__ import annotations

import httpx

from .config import settings
from .schemas import IngestionCallbackPayload, IngestionChunkSyncPayload


class NodeClient:
    def __init__(self) -> None:
        """Prepare shared headers for authenticated callbacks to the Node service."""

        self._headers = {"Content-Type": "application/json"}
        if settings.ai_service_secret:
            self._headers["x-ai-service-secret"] = settings.ai_service_secret

    async def send_status(self, payload: IngestionCallbackPayload) -> None:
        """Send task progress updates back to the Node metadata service."""
       

        async with httpx.AsyncClient(timeout=settings.callback_timeout_seconds) as client:
            response = await client.post(
                f"{settings.node_base_url}/ai/ingestion/callback",
                headers=self._headers,
                json=payload.model_dump(),
            )
            response.raise_for_status()

    async def sync_chunks(self, payload: IngestionChunkSyncPayload) -> None:
        """Push chunk metadata to Node after vectors are written successfully."""

        async with httpx.AsyncClient(timeout=settings.callback_timeout_seconds) as client:
            response = await client.post(
                f"{settings.node_base_url}/ai/ingestion/chunks",
                headers=self._headers,
                json=payload.model_dump(),
            )
            response.raise_for_status()
