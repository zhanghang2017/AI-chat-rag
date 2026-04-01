PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ingestion_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" REAL NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingestion_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ingestion_tasks_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "knowledge_files" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_ingestion_tasks" (
    "id",
    "user_id",
    "file_id",
    "status",
    "progress",
    "error_message",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "user_id",
    "file_id",
    "status",
    "progress",
    "error_message",
    "created_at",
    "updated_at"
FROM "ingestion_tasks";

DROP TABLE "ingestion_tasks";
ALTER TABLE "new_ingestion_tasks" RENAME TO "ingestion_tasks";

CREATE INDEX "idx_ingestion_tasks_user_status_created" ON "ingestion_tasks"("user_id", "status", "created_at");
CREATE INDEX "idx_ingestion_tasks_file" ON "ingestion_tasks"("file_id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;