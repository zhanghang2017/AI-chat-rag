# Node Service Functional Guide

This document is a quick onboarding reference for team members doing vibe coding on the Node backend.

## 1. Service Scope

The Node service is the API gateway and metadata service for the AI chat + RAG system.

Responsibilities:

- Serve HTTP APIs for user identity, file ingestion metadata, task status, chat sessions, and messages.
- Persist metadata in SQLite through Prisma.
- Proxy AI chat requests to Python FastAPI.
- Dispatch ingestion jobs to Python AI-server.
- Receive ingestion callbacks and chunk metadata sync from Python AI-server.
- Push ingestion updates to frontend clients over SSE.
- Normalize validation and error responses for frontend stability.

Out of scope in current MVP:

- Authentication and authorization.
- Real file binary storage pipeline.
- Final chat streaming UX on the browser side.

## 2. Runtime and Stack

- Runtime: Node.js
- Framework: Express
- Language: TypeScript
- ORM: Prisma
- DB: SQLite
- Validation: Zod
- Upload middleware: Multer (metadata-only route support)

## 3. Current Folder Architecture

```text
src/
  app.ts                     # Express app assembly
  server.ts                  # Process entrypoint
  controllers/
    chat.controller.ts       # Request parsing/validation + response mapping
    file.controller.ts
  services/
    chat.service.ts          # Business orchestration
    file.service.ts
    ai.service.ts            # FastAPI communication
    ingestionEvents.ts       # SSE fanout for ingestion updates
    ingestionScheduler.ts    # Legacy mock async ingestion transitions
  routes/
    index.ts                 # Main route map
    ai.routes.ts             # AI proxy endpoints
  middleware/
    fingerprint.ts           # fingerprint requirement guard
    upload.ts                # Multer config
  repositories/
    user.repository.ts       # user identity read/write
    file.repository.ts       # file metadata and file-task transaction
    task.repository.ts       # ingestion task read/write
    chat.repository.ts       # chat session/message read/write
  common/
    schemas.ts               # Zod schemas
    validation.ts            # Shared validate helper
    errors.ts                # API error factory + global handler
  lib/
    prisma.ts                # Prisma singleton
```

## 4. Request Lifecycle

1. Route receives request.
2. Controller validates request by Zod schema.
3. Service executes domain behavior.
4. Repository performs Prisma queries.
5. Controller returns `{ data: ... }`.
6. Any thrown error bubbles to `errorHandler` and returns normalized `{ error: ... }`.

## 5. Functional Modules

### 5.1 User Identification

Endpoint:

- `POST /v1/users/identify` (optional bootstrap)

Behavior:

- Upsert user by `userId` (legacy alias `browserFingerprintHash` is still accepted).
- Can be skipped if business endpoints already include fingerprint.

### 5.2 File Metadata + Ingestion Task

Endpoints:

- `POST /v1/files/upload`
- `POST /v1/files/precheck`
- `POST /v1/files/upload/chunked/init`
- `POST /v1/files/upload/chunked/chunk`
- `GET /v1/files/upload/chunked/status`
- `POST /v1/files/upload/chunked/complete`
- `GET /v1/files`
- `GET /v1/files/events`
- `GET /v1/tasks/:taskId`
- `POST /v1/ai/ingestion/callback`
- `POST /v1/ai/ingestion/chunks`

Behavior:

- Precheck endpoint detects duplicate file content by MD5 before upload.
- Upload endpoints create `user + file + task` in one transaction and return only file summary.
- Node dispatches ingestion jobs to Python asynchronously after file persistence.
- Python calls back with task progress and chunk metadata.
- File list supports `parseStatus`, `page`, and `limit` filtering.
- Frontend receives ingestion updates through `GET /v1/files/events` SSE.

### 5.3 Chat Session + Message

Endpoints:

- `POST /v1/chat/sessions`
- `GET /v1/chat/sessions`
- `POST /v1/chat/sessions/:id/messages`
- `GET /v1/chat/sessions/:id/messages`

Behavior:

- Sessions are scoped by fingerprint user.
- Session listing exposes `messageCount`.
- Message create/list validates session existence first.

### 5.4 AI Proxy

Endpoint:

- `POST /v1/ai/chat`

Behavior:

- Validates payload and forwards to Python `POST {AI_SERVICE_BASE_URL}/chat`.
- Uses timeout with `AbortController`.
- Maps upstream issues to API errors:
  - `AI_SERVICE_ERROR`
  - `AI_SERVICE_TIMEOUT`
  - `AI_SERVICE_UNAVAILABLE`

## 6. Data and Error Conventions

Success envelope:

```json
{
  "data": {}
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": []
  }
}
```

Common codes:

- `VALIDATION_ERROR`
- `TASK_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `RESOURCE_NOT_FOUND`
- `INTERNAL_SERVER_ERROR`
- AI proxy errors from `ai.service.ts`

## 7. Ingestion State Model

Task status (`ingestion_tasks.status`):

- `queued`
- `running`
- `success`
- `failed`
- `cancelled`

File status (`knowledge_files.parse_status`):

- `pending`
- `processing`
- `failed`
- `indexed`

Current mapping in service layer:

- task `queued` -> file `pending`
- task `running` -> file `processing`
- task `success` -> file `indexed`
- task `failed/cancelled` -> file `failed`

The legacy scheduler still exists for fallback/testing, but the intended runtime path is Python callback driven.

## 8. Local Development

Install:

```bash
npm install
```

Build check:

```bash
npm run build
```

Run server:

```bash
npm run start
```

Health check:

```bash
GET /health
```

## 9. Environment Variables

Core:

- `PORT` (default `3001`)
- `DATABASE_URL` (Prisma SQLite)

AI proxy:

- `AI_SERVICE_BASE_URL` (default `http://127.0.0.1:8000`)
- `AI_SERVICE_TIMEOUT_MS` (default `12000`)
- `AI_SERVICE_SHARED_SECRET`
- `AI_INGESTION_ENDPOINT` (optional override; defaults to `{AI_SERVICE_BASE_URL}/ingestion/jobs`)

Upload:

- `UPLOAD_MAX_FILE_SIZE_MB` (default `20`)

Legacy mock ingestion:

- `MOCK_INGEST_RUNNING_DELAY_MS`
- `MOCK_INGEST_DONE_DELAY_MS`
- `MOCK_INGEST_FAIL`

## 10. Vibe Coding Guardrails for Team

When adding new features:

- Keep routing thin: parse + validate in controller, not business logic.
- Put cross-entity orchestration in services.
- Keep Prisma calls in repository only and prefer domain-specific repository files.
- Reuse `validate` + schema modules for all inputs.
- Return unified response envelopes.
- Throw `createApiError` for domain errors; avoid raw string errors.

When adjusting ingestion behavior:

- Keep task/file status transitions centralized in `file.service.ts`.
- Treat upload response as file-summary only; ingestion progress should flow via `/v1/files` plus SSE.
- Keep Python callback validation and secret checks aligned between Node and AI-server.

## 11. Five-Minute Takeover Checklist

Use this checklist when a teammate takes over the backend for quick iteration.

### Step 1: Confirm service is healthy (1 minute)

Run:

```bash
npm install
npm run build
npm run start
```

Then verify:

- `GET /health` returns `{ "ok": true }`.

### Step 2: Locate where to modify (1 minute)

Pick by intent:

- Add/modify API contract: `src/routes/index.ts` and related controller.
- Change request validation: `src/common/schemas.ts`.
- Change business rules: `src/services/*.ts`.
- Change DB read/write behavior: `src/repositories/ragRepository.ts`.
- Change Python FastAPI integration: `src/services/ai.service.ts`.

### Step 3: Follow edit boundary rules (1 minute)

- Controller: parse + validate + response mapping only.
- Service: orchestration + domain errors.
- Repository: Prisma query only.
- Middleware: cross-cutting checks only.

If a change crosses two layers, implement both in one PR to keep behavior coherent.

### Step 4: Run focused smoke checks (1 minute)

Minimum checks after edits:

- `GET /health`
- One endpoint from the touched module (for example `POST /v1/chat/sessions` if chat changed)
- If file flow changed: `POST /v1/files/upload` then `GET /v1/tasks/:taskId`

### Step 5: Update docs before handoff (1 minute)

Always update at least one of:

- `docs/api-spec.md` when API shape/status code changed.
- `docs/node-service-functional-guide.md` when architecture/process changed.

Keep docs and behavior in the same commit to reduce handoff ambiguity.

Keep docs and behavior in the same commit to reduce handoff ambiguity.
