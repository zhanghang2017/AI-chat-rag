import { createApiUrl, requestApi } from "./httpClient";

export type FileParseStatus = "pending" | "processing" | "failed" | "indexed";

export type KnowledgeFileInfo = {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  parseStatus: FileParseStatus;
  uploadedAt: string;
};

export type KnowledgeFilesPage = {
  items: KnowledgeFileInfo[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export type IngestionStreamEvent = {
  type: string;
  timestamp: string;
  file?: KnowledgeFileInfo;
  task?: {
    id: string;
    status: string;
    progress: number;
    errorMessage: string | null;
  };
};

export type UploadResult = {
  file: KnowledgeFileInfo;
};

export type ManualIngestionDispatchResult = {
  accepted: boolean;
  file: KnowledgeFileInfo;
  task: {
    id: string;
    status: string;
    progress: number;
    errorMessage: string | null;
  };
};

export type UploadPrecheckResult = {
  exists: boolean;
  file: {
    id: string;
    fileName: string;
    parseStatus: FileParseStatus;
    uploadedAt: string;
  } | null;
};

export type ChunkSession = {
  uploadId: string;
  totalChunks: number;
  uploadedChunks: number[];
};

/**
 * 上传前检查当前用户是否已存在相同 MD5 的文件。
 * @param userId 用户 ID（浏览器指纹）。
 * @param contentMd5 文件 MD5。
 * @returns 预检结果。
 */
export async function precheckUploadFile(userId: string, contentMd5: string): Promise<UploadPrecheckResult> {
  return requestApi<UploadPrecheckResult>("/files/precheck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, contentMd5 }),
  });
}

/**
 * 获取当前用户知识库文件列表。
 * @param userId 用户 ID（浏览器指纹）。
 * @param options 查询参数。
 * @returns 文件列表。
 */
export async function getKnowledgeFiles(
  userId: string,
  options?: { parseStatus?: FileParseStatus; page?: number; limit?: number },
): Promise<KnowledgeFilesPage> {
  const params = new URLSearchParams({ userId });

  if (options?.parseStatus) {
    params.set("parseStatus", options.parseStatus);
  }

  if (typeof options?.page === "number") {
    params.set("page", String(options.page));
  }

  if (typeof options?.limit === "number") {
    params.set("limit", String(options.limit));
  }

  return requestApi<KnowledgeFilesPage>(`/files?${params.toString()}`);
}

/**
 * 直传小文件接口。
 * @param file 原始文件。
 * @param userId 用户 ID（浏览器指纹）。
 * @returns 上传结果。
 */
export async function uploadFileDirect(file: File, userId: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("file", file);

  return requestApi<UploadResult>("/files/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * 初始化分片上传会话。
 * @param payload 初始化参数。
 * @returns 分片会话信息。
 */
export async function initChunkUpload(payload: {
  uploadId: string;
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
}): Promise<ChunkSession> {
  return requestApi<ChunkSession>("/files/upload/chunked/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 查询分片上传会话状态。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @returns 分片会话信息。
 */
export async function getChunkUploadStatus(uploadId: string): Promise<ChunkSession> {
  return requestApi<ChunkSession>(`/files/upload/chunked/status?uploadId=${encodeURIComponent(uploadId)}`);
}

/**
 * 上传单个分片。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @param chunkIndex 分片序号。
 * @param blob 分片数据。
 * @returns 分片会话信息。
 */
export async function uploadChunk(uploadId: string, chunkIndex: number, blob: Blob): Promise<ChunkSession> {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("chunkIndex", String(chunkIndex));
  formData.append("file", blob);

  return requestApi<ChunkSession>("/files/upload/chunked/chunk", {
    method: "POST",
    body: formData,
  });
}

/**
 * 合并分片并完成上传。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @returns 上传结果。
 */
export async function completeChunkUpload(uploadId: string): Promise<UploadResult> {
  return requestApi<UploadResult>("/files/upload/chunked/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  });
}

export async function dispatchPendingKnowledgeFile(fileId: string, userId: string): Promise<ManualIngestionDispatchResult> {
  return requestApi<ManualIngestionDispatchResult>(`/files/${encodeURIComponent(fileId)}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export function createKnowledgeBaseEventSource(userId: string) {
  const params = new URLSearchParams({ userId });
  return new EventSource(createApiUrl(`/files/events?${params.toString()}`));
}
