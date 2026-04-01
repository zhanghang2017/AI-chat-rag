# AI-server

Minimal FastAPI ingestion service for the RAG pipeline.

## Setup

Create an isolated virtual environment inside this directory and install the local requirements file.

```powershell
Set-Location "D:/zh/langchain_rag_study/project/AI-server"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run

After the local virtual environment is activated, start the FastAPI app with uvicorn.

```powershell
Set-Location "D:/zh/langchain_rag_study/project/AI-server"
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

## Required env vars

- ZHIPUAI_API_KEY
- NODE_BASE_URL (default `http://127.0.0.1:3001/v1`)
- AI_SERVICE_SHARED_SECRET (optional but recommended)
- CHROMA_PERSIST_DIRECTORY (optional, default `./ai_chroma` under `project/AI-server`)
- EMBEDDING_BATCH_SIZE (default 64; keep at or below the upstream embedding limit)
