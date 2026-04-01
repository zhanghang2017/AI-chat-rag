PRAGMA foreign_keys=OFF;

CREATE TABLE "new_knowledge_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_md5" TEXT,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "parse_status" TEXT NOT NULL DEFAULT 'queued',
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "id",
    "user_id",
    "file_name",
    "content_md5",
    "file_size_bytes",
    "storage_path",
    CASE "parse_status"
        WHEN 'pending' THEN 'queued'
        WHEN 'processing' THEN 'running'
        WHEN 'ready' THEN 'success'
        ELSE "parse_status"
    END,
    "uploaded_at"
FROM "knowledge_files";

DROP TABLE "knowledge_files";
ALTER TABLE "new_knowledge_files" RENAME TO "knowledge_files";

CREATE INDEX "idx_knowledge_files_user_status_uploaded" ON "knowledge_files"("user_id", "parse_status", "uploaded_at");
CREATE UNIQUE INDEX "uk_knowledge_files_user_md5" ON "knowledge_files"("user_id", "content_md5");

PRAGMA foreign_keys=ON;
