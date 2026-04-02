"""FastAPI 入口，暴露健康检查与摄取任务接口。"""

from __future__ import annotations

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException

from app.config import settings
from app.knowledge_base.ingestion_service import process_knowledge_ingestion_job
from app.knowledge_base.schemas import IngestionJob
from app.knowledge_base.vector_store import KnowledgeVectorStore

app = FastAPI(title="AI Server", version="0.1.0")


@app.get("/health")
def health() -> dict[str, bool]:
    """返回轻量级健康检查结果。"""

    return {"ok": True}


@app.post("/ingestion/jobs", status_code=202)
async def create_ingestion_job(
    payload: IngestionJob,
    background_tasks: BackgroundTasks,
    x_ai_service_secret: str | None = Header(default=None),
) -> dict[str, object]:
    """接收摄取任务，并在后台异步执行。"""

    if settings.ai_service_secret and x_ai_service_secret != settings.ai_service_secret:
        raise HTTPException(status_code=401, detail="Invalid AI service secret")

    # 通过 BackgroundTasks 将耗时的解析和向量化流程移出请求主链路。
    background_tasks.add_task(process_knowledge_ingestion_job, payload)
    return {
        "accepted": True,
        "taskId": payload.taskId,
        "fileId": payload.fileId,
    }


@app.delete("/vectors/files/{file_id}")
def delete_file_vectors(
    file_id: str,
    x_ai_service_secret: str | None = Header(default=None),
) -> dict[str, object]:
    """删除某个文件在向量库中的所有分块。"""

    if settings.ai_service_secret and x_ai_service_secret != settings.ai_service_secret:
        raise HTTPException(status_code=401, detail="Invalid AI service secret")

    vector_store = KnowledgeVectorStore()
    vector_store.delete_file_chunks(file_id)

    return {
        "deleted": True,
        "fileId": file_id,
    }
