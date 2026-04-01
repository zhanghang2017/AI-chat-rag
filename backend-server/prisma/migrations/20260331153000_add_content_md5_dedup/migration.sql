-- Add content hash column for file-level deduplication
ALTER TABLE "knowledge_files" ADD COLUMN "content_md5" TEXT;

-- Deduplicate at user scope: same user + same content should map to one file record
CREATE UNIQUE INDEX "uk_knowledge_files_user_md5" ON "knowledge_files"("user_id", "content_md5");
