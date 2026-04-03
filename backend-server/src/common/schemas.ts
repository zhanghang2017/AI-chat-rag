import { z } from "zod";

function resolveRequiredUserId(data: { userId?: string; browserFingerprintHash?: string }) {
  return data.userId ?? data.browserFingerprintHash;
}

const md5HexSchema = z.string().regex(/^[a-fA-F0-9]{32}$/);

// Shared primitives reused across multiple query/body schemas.
export const fingerprintSchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({ userId: resolveRequiredUserId(data)! }));

export const uploadBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({ userId: resolveRequiredUserId(data)! }));

export const filePrecheckBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    contentMd5: md5HexSchema,
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    contentMd5: data.contentMd5.toLowerCase(),
  }));

export const chunkUploadInitBodySchema = z
  .object({
    uploadId: md5HexSchema,
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    fileName: z.string().min(1),
    fileSizeBytes: z.coerce.number().int().positive(),
    totalChunks: z.coerce.number().int().min(1),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    uploadId: data.uploadId,
    userId: resolveRequiredUserId(data)!,
    fileName: data.fileName,
    fileSizeBytes: data.fileSizeBytes,
    totalChunks: data.totalChunks,
  }));

export const chunkUploadBodySchema = z.object({
  uploadId: md5HexSchema,
  chunkIndex: z.coerce.number().int().min(0),
});

export const chunkUploadStatusQuerySchema = z.object({
  uploadId: md5HexSchema,
});

export const chunkUploadCompleteBodySchema = z.object({
  uploadId: md5HexSchema,
});

// Knowledge-file parse lifecycle exposed to the frontend.
const parseStatusEnum = z.enum(["pending", "processing", "failed", "indexed"]);

export const filesQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  browserFingerprintHash: z.string().min(1).optional(),
  parseStatus: parseStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    parseStatus: data.parseStatus,
    page: data.page,
    limit: data.limit,
  }));

export const taskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const fileParamsSchema = z.object({
  fileId: z.string().uuid(),
});

export const fileDetailQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  browserFingerprintHash: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
})
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    page: data.page,
    limit: data.limit,
  }));

export const createSessionBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    title: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    title: data.title,
  }));

export const sessionsQuerySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    limit: data.limit,
  }));

export const sessionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const deleteSessionsBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    sessionIds: z.array(z.string().uuid()).min(1),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    sessionIds: data.sessionIds,
  }));

export const messageBodySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const chatCompletionBodySchema = z
  .object({
    content: z.string().min(1),
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    content: data.content,
    userId: resolveRequiredUserId(data)!,
  }));

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// Input contract for forwarding user queries to Python AI service.
export const aiChatBodySchema = z
  .object({
    query: z.string().min(1),
    sessionId: z.string().uuid().optional(),
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    recentMessages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })).optional(),
  })
  .transform((data) => ({
    query: data.query,
    sessionId: data.sessionId,
    userId: data.userId ?? data.browserFingerprintHash,
    recentMessages: data.recentMessages,
  }));

const taskStatusEnum = z.enum(["queued", "running", "success", "failed", "cancelled"]);

export const ingestionChunkSyncBodySchema = z
  .object({
    taskId: z.string().uuid(),
    fileId: z.string().uuid(),
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    collectionName: z.string().min(1),
    parseVersion: z.coerce.number().int().min(1).default(1),
    chunks: z.array(z.object({
      chunkIndex: z.coerce.number().int().min(0),
      vectorId: z.string().min(1),
      chunkHash: z.string().min(1),
      contentPreview: z.string().min(1),
      pageNumber: z.coerce.number().int().min(0).nullable().optional(),
    })).default([]),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    taskId: data.taskId,
    fileId: data.fileId,
    userId: resolveRequiredUserId(data)!,
    collectionName: data.collectionName,
    parseVersion: data.parseVersion,
    chunks: data.chunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      vectorId: chunk.vectorId,
      chunkHash: chunk.chunkHash,
      contentPreview: chunk.contentPreview,
      pageNumber: chunk.pageNumber ?? null,
    })),
  }));

export const ingestionCallbackBodySchema = z.object({
  taskId: z.string().uuid(),
  fileId: z.string().uuid().optional(),
  status: taskStatusEnum,
  progress: z.number().min(0).max(100).optional(),
  chunkCount: z.coerce.number().int().min(0).nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});
