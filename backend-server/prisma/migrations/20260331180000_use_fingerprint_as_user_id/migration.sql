PRAGMA foreign_keys=OFF;

CREATE TABLE "new_app_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "browser_fingerprint_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_app_users" ("id", "browser_fingerprint_hash", "created_at")
SELECT "browser_fingerprint_hash", "browser_fingerprint_hash", "created_at"
FROM "app_users";

CREATE TABLE "new_knowledge_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_md5" TEXT,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "parse_status" TEXT NOT NULL DEFAULT 'pending',
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "new_app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_knowledge_files" (
    "id",
    "user_id",
    "file_name",
    "content_md5",
    "file_size_bytes",
    "storage_path",
    "parse_status",
    "uploaded_at"
)
SELECT
    files."id",
    users."browser_fingerprint_hash",
    files."file_name",
    files."content_md5",
    files."file_size_bytes",
    files."storage_path",
    files."parse_status",
    files."uploaded_at"
FROM "knowledge_files" AS files
JOIN "app_users" AS users ON users."id" = files."user_id";

CREATE TABLE "new_ingestion_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" REAL NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingestion_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "new_app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ingestion_tasks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "new_knowledge_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_ingestion_tasks" (
    "id",
    "user_id",
    "file_id",
    "status",
    "progress",
    "error_message",
    "created_at"
)
SELECT
    tasks."id",
    users."browser_fingerprint_hash",
    tasks."file_id",
    tasks."status",
    tasks."progress",
    tasks."error_message",
    tasks."created_at"
FROM "ingestion_tasks" AS tasks
JOIN "app_users" AS users ON users."id" = tasks."user_id";

CREATE TABLE "new_file_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "vector_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "file_chunks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "new_knowledge_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_file_chunks" ("id", "file_id", "chunk_index", "vector_id", "created_at")
SELECT "id", "file_id", "chunk_index", "vector_id", "created_at"
FROM "file_chunks";

CREATE TABLE "new_chat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "new_app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_chat_sessions" ("id", "user_id", "title", "created_at")
SELECT
    sessions."id",
    users."browser_fingerprint_hash",
    sessions."title",
    sessions."created_at"
FROM "chat_sessions" AS sessions
JOIN "app_users" AS users ON users."id" = sessions."user_id";

CREATE TABLE "new_chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "new_chat_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_chat_messages" ("id", "session_id", "role", "content", "created_at")
SELECT "id", "session_id", "role", "content", "created_at"
FROM "chat_messages";

DROP TABLE "chat_messages";
DROP TABLE "chat_sessions";
DROP TABLE "file_chunks";
DROP TABLE "ingestion_tasks";
DROP TABLE "knowledge_files";
DROP TABLE "app_users";

ALTER TABLE "new_app_users" RENAME TO "app_users";
ALTER TABLE "new_knowledge_files" RENAME TO "knowledge_files";
ALTER TABLE "new_ingestion_tasks" RENAME TO "ingestion_tasks";
ALTER TABLE "new_file_chunks" RENAME TO "file_chunks";
ALTER TABLE "new_chat_sessions" RENAME TO "chat_sessions";
ALTER TABLE "new_chat_messages" RENAME TO "chat_messages";

CREATE UNIQUE INDEX "app_users_browser_fingerprint_hash_key" ON "app_users"("browser_fingerprint_hash");
CREATE INDEX "idx_knowledge_files_user_status_uploaded" ON "knowledge_files"("user_id", "parse_status", "uploaded_at");
CREATE UNIQUE INDEX "uk_knowledge_files_user_md5" ON "knowledge_files"("user_id", "content_md5");
CREATE INDEX "idx_ingestion_tasks_user_status_created" ON "ingestion_tasks"("user_id", "status", "created_at");
CREATE INDEX "idx_ingestion_tasks_file" ON "ingestion_tasks"("file_id");
CREATE UNIQUE INDEX "file_chunks_vector_id_key" ON "file_chunks"("vector_id");
CREATE INDEX "idx_file_chunks_file_order" ON "file_chunks"("file_id", "chunk_index");
CREATE UNIQUE INDEX "file_chunks_file_id_chunk_index_key" ON "file_chunks"("file_id", "chunk_index");
CREATE INDEX "idx_chat_sessions_user_last_message" ON "chat_sessions"("user_id", "created_at");
CREATE INDEX "idx_chat_messages_session_created" ON "chat_messages"("session_id", "created_at");

PRAGMA foreign_keys=ON;
