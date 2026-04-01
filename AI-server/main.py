from __future__ import annotations

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException

from app.config import settings
from app.ingestion import process_ingestion_job
from app.schemas import IngestionJob

app = FastAPI(title="AI Server", version="0.1.0")


@app.get("/health")
def health() -> dict[str, bool]:
    """Return a lightweight readiness response for local health checks."""

    return {"ok": True}


@app.post("/ingestion/jobs", status_code=202)
async def create_ingestion_job(
    payload: IngestionJob,
    background_tasks: BackgroundTasks,
    x_ai_service_secret: str | None = Header(default=None),
) -> dict[str, object]:
    """Accept an ingestion job and schedule it for background processing."""

    if settings.ai_service_secret and x_ai_service_secret != settings.ai_service_secret:
        raise HTTPException(status_code=401, detail="Invalid AI service secret")

    background_tasks.add_task(process_ingestion_job, payload)
    return {
        "accepted": True,
        "taskId": payload.taskId,
        "fileId": payload.fileId,
    }
