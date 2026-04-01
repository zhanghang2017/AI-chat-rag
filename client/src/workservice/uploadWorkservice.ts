import SparkMD5 from "spark-md5";

type UploadStatusTone = "success" | "warning" | "error";

import {
  dispatchPendingKnowledgeFile,
  completeChunkUpload,
  getKnowledgeFiles,
  getChunkUploadStatus,
  initChunkUpload,
  precheckUploadFile,
  uploadChunk,
  uploadFileDirect,
} from "../api";
import type { FileParseStatus, KnowledgeFileInfo, KnowledgeFilesPage, UploadResult } from "../api";
import { uploadConfig } from "./uploadConfig";

export type KnowledgeBaseUploadOutcome = {
  alreadyExists: boolean;
};

export type KnowledgeBaseFilter = "all" | FileParseStatus;

export type KnowledgeBaseRowsPage = {
  rows: UploadLibraryRow[];
  pagination: KnowledgeFilesPage["pagination"];
};

export type UploadLibraryRow = {
  id: string;
  icon: string;
  name: string;
  size: string;
  status: string;
  statusTone: UploadStatusTone;
  added: string;
  rawStatus: FileParseStatus;
  canDispatch: boolean;
};

type UploadCallbacks = {
  onUploadingProgress?: (percent: number) => void;
  onPhaseChange?: (phase: "hashing" | "uploading" | "done" | "failed") => void;
};

const CHUNK_SIZE_BYTES = uploadConfig.chunkSizeBytes;
const CHUNK_CONCURRENCY = uploadConfig.chunkConcurrency;
const CHUNK_RETRY_LIMIT = uploadConfig.chunkRetryLimit;
const SMALL_FILE_THRESHOLD_BYTES = uploadConfig.smallFileThresholdBytes;
const HASH_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatAddedLabel(uploadedAt: string) {
  const date = new Date(uploadedAt);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return uploadedAt;
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function resolveIcon(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx") || lower.endsWith(".txt")) {
    return "description";
  }
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
    return "image";
  }
  return "draft";
}

function resolveStatusDisplay(status: FileParseStatus) {
  switch (status) {
    case "indexed":
      return { label: "Indexed", tone: "success" as const };
    case "failed":
      return { label: "Failed", tone: "error" as const };
    case "processing":
      return { label: "Processing", tone: "warning" as const };
    case "pending":
    default:
      return { label: "Pending", tone: "warning" as const };
  }
}

export function mapKnowledgeFileToRow(file: KnowledgeFileInfo): UploadLibraryRow {
  const statusDisplay = resolveStatusDisplay(file.parseStatus);

  return {
    id: file.id,
    icon: resolveIcon(file.fileName),
    name: file.fileName,
    size: formatFileSize(file.fileSizeBytes),
    status: statusDisplay.label,
    statusTone: statusDisplay.tone,
    added: formatAddedLabel(file.uploadedAt),
    rawStatus: file.parseStatus,
    canDispatch: file.parseStatus === "pending"||file.parseStatus === "failed",
  };
}

/**
 * 计算文件 MD5，用于上传前去重校验与分片上传会话标识。
 * @param file 原始文件对象。
 * @returns 32 位十六进制哈希字符串。
 */
async function computeFileMd5(file: File) {
  const spark = new SparkMD5.ArrayBuffer();

  for (let offset = 0; offset < file.size; offset += HASH_CHUNK_SIZE_BYTES) {
    const chunk = await file.slice(offset, offset + HASH_CHUNK_SIZE_BYTES).arrayBuffer();
    spark.append(chunk);
  }

  return spark.end();
}

/**
 * 获取或生成用户 ID（当前实现为浏览器指纹）。
 * 会自动兼容并迁移旧的 localStorage key。
 * @returns 用户 ID 字符串。
 */
export function getOrCreateUserId() {
  const key = "rag.userId";
  const legacyKey = "rag.browserFingerprintHash";
  const existed = localStorage.getItem(key) || localStorage.getItem(legacyKey);
  if (existed) {
    localStorage.setItem(key, existed);
    localStorage.removeItem(legacyKey);
    return existed;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export async function fetchKnowledgeBaseRows(
  filter: KnowledgeBaseFilter = "all",
  page = 1,
  limit = 10,
): Promise<KnowledgeBaseRowsPage> {
  const userId = getOrCreateUserId();
  const response = await getKnowledgeFiles(userId, {
    parseStatus: filter === "all" ? undefined : filter,
    page,
    limit,
  });

  return {
    rows: response.items.map(mapKnowledgeFileToRow),
    pagination: response.pagination,
  };
}

export async function requestPendingFileIngestion(fileId: string) {
  const userId = getOrCreateUserId();
  return dispatchPendingKnowledgeFile(fileId, userId);
}

/**
 * 生成断点续传缓存 key。
 * @param file 文件对象。
 * @param userId 用户 ID。
 * @returns localStorage key。
 */
function getResumeStorageKey(file: File, userId: string) {
  return `rag.upload.session.${userId}.${file.name}.${file.size}.${file.lastModified}`;
}

/**
 * 调用小文件直传接口。
 * @param file 文件对象。
 * @param userId 用户 ID。
 * @returns 上传结果。
 */
async function uploadSmallFile(file: File, userId: string): Promise<UploadResult> {
  return uploadFileDirect(file, userId);
}

/**
 * 初始化或恢复分片上传会话。
 * @param file 文件对象。
 * @param userId 用户 ID。
 * @param uploadId 文件 MD5 uploadId。
 * @returns 分片会话信息与缓存 key。
 */
async function initOrResumeChunkSession(file: File, userId: string, uploadId: string) {
  const storageKey = getResumeStorageKey(file, userId);
  const resumedUploadId = localStorage.getItem(storageKey) || uploadId;
  if (resumedUploadId) {
    try {
      const status = await getChunkUploadStatus(resumedUploadId);

      return {
        uploadId: status.uploadId,
        uploadedChunks: status.uploadedChunks,
        totalChunks: status.totalChunks,
        storageKey,
      };
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);
  const session = await initChunkUpload({
    uploadId,
    userId,
    fileName: file.name,
    fileSizeBytes: file.size,
    totalChunks,
  });

  localStorage.setItem(storageKey, session.uploadId);

  return {
    uploadId: session.uploadId,
    totalChunks: session.totalChunks,
    uploadedChunks: session.uploadedChunks,
    storageKey,
  };
}

/**
 * 上传单个分片，失败时自动指数退避重试。
 * @param uploadId 分片会话 ID。
 * @param chunkIndex 分片序号。
 * @param blob 分片数据。
 * @returns 无返回值。
 */
async function uploadChunkWithRetry(uploadId: string, chunkIndex: number, blob: Blob) {
  let attempt = 0;
  while (attempt < CHUNK_RETRY_LIMIT) {
    try {
      await uploadChunk(uploadId, chunkIndex, blob);

      return;
    } catch (error) {
      attempt += 1;
      if (attempt >= CHUNK_RETRY_LIMIT) {
        throw error;
      }
      const delayMs = 500 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * 执行大文件分片上传。
 * @param file 文件对象。
 * @param userId 用户 ID。
 * @param uploadId 分片会话 ID（文件 MD5）。
 * @param callbacks 进度与阶段回调。
 * @returns 上传结果。
 */
async function uploadChunkedFile(
  file: File,
  userId: string,
  uploadId: string,
  callbacks?: UploadCallbacks,
): Promise<UploadResult> {
  const session = await initOrResumeChunkSession(file, userId, uploadId);
  const uploadedSet = new Set(session.uploadedChunks);
  const totalChunks = session.totalChunks;

  const allIndices = Array.from({ length: totalChunks }, (_, i) => i);
  const pending = allIndices.filter((index) => !uploadedSet.has(index));

  let completedCount = uploadedSet.size;
  callbacks?.onUploadingProgress?.((completedCount / totalChunks) * 100);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(CHUNK_CONCURRENCY, pending.length) }, async () => {
    while (cursor < pending.length) {
      const target = pending[cursor];
      cursor += 1;

      const start = target * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
      const chunkBlob = file.slice(start, end);

      await uploadChunkWithRetry(session.uploadId, target, chunkBlob);
      completedCount += 1;
      callbacks?.onUploadingProgress?.((completedCount / totalChunks) * 100);
    }
  });

  await Promise.all(workers);

  const result = await completeChunkUpload(session.uploadId);

  localStorage.removeItem(session.storageKey);
  return result;
}

/**
 * 对外统一上传入口：自动选择小文件直传或大文件分片上传。
 * @param file 文件对象。
 * @param callbacks 上传阶段回调。
 * @returns 上传流程结果；知识库列表应通过后端文件接口刷新。
 */
export async function uploadFileToKnowledgeBase(file: File, callbacks?: UploadCallbacks): Promise<KnowledgeBaseUploadOutcome> {
  const userId = getOrCreateUserId();
  callbacks?.onPhaseChange?.("hashing");
  const contentMd5 = await computeFileMd5(file);
  const precheck = await precheckUploadFile(userId, contentMd5);

  if (precheck.exists) {
    callbacks?.onPhaseChange?.("done");
    return { alreadyExists: true };
  }

  callbacks?.onPhaseChange?.("uploading");

  if (file.size <= SMALL_FILE_THRESHOLD_BYTES) {
    await uploadSmallFile(file, userId);
  } else {
    await uploadChunkedFile(file, userId, contentMd5, callbacks);
  }

  callbacks?.onPhaseChange?.("done");
  return { alreadyExists: false };
}
