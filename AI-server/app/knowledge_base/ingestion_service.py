"""实现知识库文件的解析、切块、向量化和状态回调流程。"""

from __future__ import annotations

import hashlib
import re
import uuid
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.knowledge_base.document_loader import load_knowledge_documents
from app.knowledge_base.ingestion_callback_client import KnowledgeIngestionCallbackClient
from app.knowledge_base.schemas import IngestionCallbackPayload, IngestionChunkSyncPayload, IngestionJob
from app.knowledge_base.vector_store import KnowledgeVectorStore


_whitespace_re = re.compile(r"\s+")


def _normalize_text(value: str) -> str:
    """压缩连续空白字符，生成更紧凑的文本预览。"""

    return _whitespace_re.sub(" ", value).strip()


def _build_preview(value: str, limit: int = 240) -> str:
    """为 Node 侧元数据生成简短的分块摘要。"""

    normalized = _normalize_text(value)
    return normalized[:limit] if normalized else "(empty chunk)"


async def process_knowledge_ingestion_job(job: IngestionJob) -> None:
    """执行单个知识库文件的完整入库流程。"""

    callback_client = KnowledgeIngestionCallbackClient()
    knowledge_vector_store = KnowledgeVectorStore()

    try:
        # 先通知上游任务已经开始执行，便于前端尽快进入处理中状态。
        await callback_client.send_status(
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

        # 文件存在后再推进进度，避免上游误以为解析已经开始。
        await callback_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=15,
            )
        )

        documents = load_knowledge_documents(str(file_path))
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )
        split_documents = splitter.split_documents(documents)

        # 先上报预计分块数，让 Node 侧可以同步更新任务统计信息。
        await callback_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=45,
                chunkCount=len(split_documents),
            )
        )

        knowledge_vector_store.delete_file_chunks(job.fileId)

        chunk_documents: list[Document] = []
        ids: list[str] = []
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

            ids.append(vector_id)
            # 这些 metadata 会随向量一同写入 Chroma，供后续按文件维度清理和追踪。
            chunk_documents.append(
                Document(
                    id=vector_id,
                    page_content=text,
                    metadata={
                        "user_id": job.userId,
                        "file_id": job.fileId,
                        "task_id": job.taskId,
                        "chunk_index": chunk_index,
                        "page_number": page_number,
                        "file_name": job.fileName,
                        "content_md5": job.contentMd5,
                    },
                )
            )
            chunk_payloads.append({
                "chunkIndex": chunk_index,
                "vectorId": vector_id,
                "chunkHash": chunk_hash,
                "contentPreview": preview,
                "pageNumber": page_number,
            })

        # 向量写入前再次推进进度，区分“已切块”和“已落库”两个阶段。
        await callback_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="running",
                progress=70,
                chunkCount=len(chunk_payloads),
            )
        )

        knowledge_vector_store.add_chunks(documents=chunk_documents, ids=ids)

        # 向量落库成功后，再同步 Node 侧需要展示和检索的分块元信息。
        await callback_client.sync_chunks(
            IngestionChunkSyncPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                userId=job.userId,
                collectionName=settings.chroma_collection_name,
                parseVersion=job.parseVersion,
                chunks=chunk_payloads,
            )
        )

        await callback_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="success",
                progress=100,
                chunkCount=len(chunk_payloads),
            )
        )
    except Exception as error:  # noqa: BLE001
        # 任意阶段失败都统一回传失败状态，避免上游任务卡在 running。
        await callback_client.send_status(
            IngestionCallbackPayload(
                taskId=job.taskId,
                fileId=job.fileId,
                status="failed",
                progress=100,
                errorMessage=str(error),
            )
        )
