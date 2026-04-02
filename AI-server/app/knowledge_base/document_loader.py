"""根据知识库文件类型选择合适的文档加载器。"""

from __future__ import annotations

from pathlib import Path

from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from langchain_core.documents import Document


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def load_knowledge_documents(file_path: str) -> list[Document]:
    """将受支持的知识库文件加载为 LangChain 文档对象。"""

    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}")

    # PDF 按页拆成多个 Document，其余格式通常作为单个逻辑文档处理。
    if suffix == ".pdf":
        return PyPDFLoader(str(path), mode="page").load()
    if suffix == ".docx":
        return Docx2txtLoader(str(path)).load()
    return TextLoader(str(path), encoding="utf-8").load()
