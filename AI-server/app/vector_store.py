'''
Editor: zhanghang
Description: 
Date: 2026-04-01 11:46:32
LastEditors: zhanghang
LastEditTime: 2026-04-01 18:19:06
'''
from __future__ import annotations

from langchain_chroma import Chroma

from .config import settings
from .embeddings import get_embedding_model


class VectorStoreClient:
    def __init__(self) -> None:
        """Initialize the Chroma collection used by the ingestion pipeline."""
        print('settings.chroma_persist_directory',settings.chroma_persist_directory)
        self._store = Chroma(
            collection_name=settings.chroma_collection_name,
            embedding_function=get_embedding_model(),
            persist_directory=settings.chroma_persist_directory,
        )
        self._embedding_batch_size = settings.embedding_batch_size

    def delete_file_chunks(self, file_id: str) -> None:
        """Remove all stored vectors for a file before re-indexing it."""

        self._store.delete(where={"file_id": file_id})

    def add_chunks(self, texts: list[str], metadatas: list[dict[str, object]], ids: list[str]) -> None:
        """Persist chunk texts and metadata into the vector store."""

        if not texts:
            return

        for start in range(0, len(texts), self._embedding_batch_size):
            end = start + self._embedding_batch_size
            self._store.add_texts(
                texts=texts[start:end],
                metadatas=metadatas[start:end],
                ids=ids[start:end],
            )
