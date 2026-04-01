export const uploadConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/v1",
  chunkSizeBytes: Number(import.meta.env.VITE_UPLOAD_CHUNK_SIZE_BYTES || 4 * 1024 * 1024),
  chunkConcurrency: Number(import.meta.env.VITE_UPLOAD_CHUNK_CONCURRENCY || 4),
  chunkRetryLimit: Number(import.meta.env.VITE_UPLOAD_CHUNK_RETRY_LIMIT || 3),
  smallFileThresholdBytes: Number(import.meta.env.VITE_UPLOAD_SMALL_FILE_THRESHOLD_BYTES || 20 * 1024 * 1024),
};
