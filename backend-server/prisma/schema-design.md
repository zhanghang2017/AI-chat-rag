# Node + SQLite Schema Design (MVP Minimal)

目标: 每张表只保留跑通核心流程所需字段。

核心流程: 用户 ID 识别 -> 上传文件 -> 异步入库 -> 会话聊天 -> 消息记录。

约定: 对外统一使用 `userId` 命名；当前 `userId` 的实际值就是浏览器指纹。

## 1) app_users

Purpose: 用户表。

Columns:

- id: 主键，直接存储 `userId`（当前值为浏览器指纹）。
- browser_fingerprint_hash: 兼容字段，保存与 `id` 相同的指纹值。
- created_at: 创建时间。

## 2) knowledge_files

Purpose: 上传文件主表。

Columns:

- id: 文件 UUID。
- user_id: 所属用户 ID（当前值为浏览器指纹）。
- file_name: 文件名。
- file_size_bytes: 文件大小。
- storage_path: 存储路径。
- parse_status: 入库状态，与 ingestion_tasks.status 保持一致(queued/running/success/failed/cancelled)。
- uploaded_at: 上传时间。

## 3) ingestion_tasks

Purpose: 异步入库任务表。

Columns:

- id: 任务 UUID。
- user_id: 所属用户 ID（当前值为浏览器指纹）。
- file_id: 对应文件。
- status: 任务状态(queued/running/success/failed/cancelled)。
- progress: 进度(0-100)。
- error_message: 失败原因。
- created_at: 创建时间。

## 4) file_chunks

Purpose: 文件分块与向量 ID 映射。

Columns:

- id: 分块 UUID。
- file_id: 所属文件。
- chunk_index: 分块序号。
- vector_id: 向量库中的向量 ID。
- created_at: 创建时间。

## 5) chat_sessions

Purpose: 会话头表(对话容器)。

Columns:

- id: 会话 UUID。
- user_id: 所属用户 ID（当前值为浏览器指纹）。
- title: 会话标题。
- created_at: 创建时间。

## 6) chat_messages

Purpose: 会话消息表。

Columns:

- id: 消息 UUID。
- session_id: 所属会话。
- role: user/assistant。
- content: 消息内容。
- created_at: 创建时间。

## Minimal Indexing

- knowledge_files(user_id, parse_status, uploaded_at)
- ingestion_tasks(user_id, status, created_at)
- ingestion_tasks(file_id)
- file_chunks(file_id, chunk_index)
- chat_sessions(user_id, created_at)
- chat_messages(session_id, created_at)

## Recommended API Mapping

- GET /v1/files -> knowledge_files list
- POST /v1/files/upload -> create knowledge_files + ingestion_tasks
- GET /v1/tasks/:taskId -> ingestion_tasks state
- GET /v1/files/:fileId/chunks -> file_chunks list
- POST /v1/chat/sessions -> create chat_sessions
- POST /v1/chat/sessions/:id/messages -> create chat_messages
