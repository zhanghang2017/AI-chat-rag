'''
Editor: zhanghang
Description: 
Date: 2026-04-01 11:46:23
LastEditors: zhanghang
LastEditTime: 2026-04-01 11:46:33
'''
from __future__ import annotations

from pathlib import Path

from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_core.documents import Document


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def load_documents(file_path: str) -> list[Document]:
    """Load a supported local file into LangChain documents."""

    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}")

    if suffix == ".pdf":
        return PyPDFLoader(str(path), mode="page").load()
    if suffix == ".docx":
        return Docx2txtLoader(str(path)).load()
    return TextLoader(str(path), encoding="utf-8").load()
