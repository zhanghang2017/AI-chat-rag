from __future__ import annotations

import hashlib
import re
import uuid
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter

from .config import settings
from .loaders import load_documents
from .node_client import NodeClient
from .schemas import IngestionCallbackPayload, IngestionChunkSyncPayload, IngestionJob
from .vector_store import VectorStoreClient


_whitespace_re = re.compile(r"\s+")


def _normalize_text(value: str) -> str:
    """Collapse repeated whitespace so previews remain compact and readable."""

    return _whitespace_re.sub(" ", value).strip()


def _build_preview(value: str, limit: int = 240) -> str:
    """Build a short chunk preview for Node-side metadata storage."""

    normalized = _normalize_text(value)
    return normalized[:limit] if normalized else "(empty chunk)"


async def process_ingestion_job(job: IngestionJob) -> None:
    """Execute the full ingestion flow for one uploaded knowledge file."""

    node_client = NodeClient()
    vector_store = VectorStoreClient()

    try:
        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=5,
            )
        )

        file_path = Path(job.absoluteFilePath)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=15,
            )
        )

        documents = load_documents(str(file_path))
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )
        split_documents = splitter.split_documents(documents)

        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=45,
                chunkCount=len(split_documents),
            )
        )

        vector_store.delete_file_chunks(job.fileId)

        texts: list[str] = []
        ids: list[str] = []
        metadatas: list[dict[str, object]] = []
        chunk_payloads = []

        for chunk_index, document in enumerate(split_documents):
            text = document.page_content.strip()
            if not text:
                continue

            vector_id = str(uuid.uuid4())
            chunk_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
            page_number = document.metadata.get("page")
            page_number = int(page_number) if isinstance(page_number, int) else None
            preview = _build_preview(text)

            texts.append(text)
            ids.append(vector_id)
            metadatas.append({
                "user_id": job.userId,
                "file_id": job.fileId,
                "task_id": job.taskId,
                "chunk_index": chunk_index,
                "page_number": page_number,
                "file_name": job.fileName,
                "content_md5": job.contentMd5,
            })
            chunk_payloads.append({
                "chunkIndex": chunk_index,
                "vectorId": vector_id,
                "chunkHash": chunk_hash,
                "contentPreview": preview,
                "pageNumber": page_number,
            })

        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=70,
                chunkCount=len(chunk_payloads),
            )
        )

        vector_store.add_chunks(texts=texts, metadatas=metadatas, ids=ids)

        await node_client.sync_chunks(
            IngestionChunkSyncPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                userId=job.userId,
                collectionName=settings.chroma_collection_name,
                parseVersion=job.parseVersion,
                chunks=chunk_payloads,
            )
        )

        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="success",
                progress=100,
                chunkCount=len(chunk_payloads),
            )
        )
    except Exception as error:  # noqa: BLE001
        await node_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="failed",
                progress=100,
                errorMessage=str(error),
            )
        )
