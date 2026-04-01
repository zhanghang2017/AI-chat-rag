/*
  Warnings:

  - Added the required column `chunk_hash` to the `file_chunks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collection_name` to the `file_chunks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content_preview` to the `file_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_file_chunks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "vector_id" TEXT NOT NULL,
    "collection_name" TEXT NOT NULL,
    "chunk_hash" TEXT NOT NULL,
    "content_preview" TEXT NOT NULL,
    "page_number" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "file_chunks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "knowledge_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_file_chunks" ("chunk_index", "created_at", "file_id", "id", "vector_id") SELECT "chunk_index", "created_at", "file_id", "id", "vector_id" FROM "file_chunks";
DROP TABLE "file_chunks";
ALTER TABLE "new_file_chunks" RENAME TO "file_chunks";
CREATE UNIQUE INDEX "file_chunks_vector_id_key" ON "file_chunks"("vector_id");
CREATE INDEX "idx_file_chunks_file_order" ON "file_chunks"("file_id", "chunk_index");
CREATE UNIQUE INDEX "file_chunks_file_id_chunk_index_key" ON "file_chunks"("file_id", "chunk_index");
CREATE TABLE "new_ingestion_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "phase" TEXT NOT NULL DEFAULT 'queued',
    "progress" REAL NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingestion_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ingestion_tasks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "knowledge_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ingestion_tasks" ("created_at", "error_message", "file_id", "id", "progress", "status", "user_id") SELECT "created_at", "error_message", "file_id", "id", "progress", "status", "user_id" FROM "ingestion_tasks";
DROP TABLE "ingestion_tasks";
ALTER TABLE "new_ingestion_tasks" RENAME TO "ingestion_tasks";
CREATE INDEX "idx_ingestion_tasks_user_status_created" ON "ingestion_tasks"("user_id", "status", "created_at");
CREATE INDEX "idx_ingestion_tasks_file" ON "ingestion_tasks"("file_id");
CREATE TABLE "new_knowledge_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_md5" TEXT,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "parse_status" TEXT NOT NULL DEFAULT 'pending',
    "parse_version" INTEGER NOT NULL DEFAULT 1,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "indexed_at" DATETIME,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_files" ("content_md5", "file_name", "file_size_bytes", "id", "parse_status", "storage_path", "uploaded_at", "user_id") SELECT "content_md5", "file_name", "file_size_bytes", "id", "parse_status", "storage_path", "uploaded_at", "user_id" FROM "knowledge_files";
DROP TABLE "knowledge_files";
ALTER TABLE "new_knowledge_files" RENAME TO "knowledge_files";
CREATE INDEX "idx_knowledge_files_user_status_uploaded" ON "knowledge_files"("user_id", "parse_status", "uploaded_at");
CREATE UNIQUE INDEX "uk_knowledge_files_user_md5" ON "knowledge_files"("user_id", "content_md5");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
