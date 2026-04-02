"""封装知识库 Chroma 向量库读写操作。"""

from __future__ import annotations

from pathlib import Path

from langchain_core.documents import Document
from langchain_chroma import Chroma

from app.config import settings
from app.knowledge_base.embedding_model import create_embedding_model


class KnowledgeVectorStore:
    """负责知识库文件分块向量的删除和批量写入。"""

    def __init__(self) -> None:
        """初始化知识库入库流程使用的 Chroma collection。"""

        Path(settings.chroma_persist_directory).mkdir(parents=True, exist_ok=True)
        self._store = Chroma(
            collection_name=settings.chroma_collection_name,
            embedding_function=create_embedding_model(),
            persist_directory=settings.chroma_persist_directory,
        )
        self._embedding_batch_size = settings.embedding_batch_size

    def delete_file_chunks(self, file_id: str) -> None:
        """在重新索引前，先清理该知识库文件已有的所有向量。"""

        self._store.delete(where={"file_id": file_id})

    def add_chunks(
        self,
        documents: list[Document],
        ids: list[str],
    ) -> None:
        """将知识库文本分块及其元数据批量写入向量库。"""

        if not documents:
            return

        # 嵌入请求按批次提交，避免单次写入过大导致超时或内存抖动。
        for start in range(0, len(documents), self._embedding_batch_size):
            end = start + self._embedding_batch_size
            self._store.add_documents(
                documents=documents[start:end],
                ids=ids[start:end],
            )
