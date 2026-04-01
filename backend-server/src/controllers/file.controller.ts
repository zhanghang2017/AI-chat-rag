import type { NextFunction, Request, Response } from "express";
import { createApiError } from "../common/errors";
import {
  chunkUploadBodySchema,
  chunkUploadCompleteBodySchema,
  ingestionChunkSyncBodySchema,
  chunkUploadInitBodySchema,
  chunkUploadStatusQuerySchema,
  fileParamsSchema,
  filePrecheckBodySchema,
  filesQuerySchema,
  fingerprintSchema,
  ingestionCallbackBodySchema,
  taskParamsSchema,
  uploadBodySchema,
} from "../common/schemas";
import { validate } from "../common/validation";
import * as fileService from "../services/file.service";

/**
 * 根据浏览器指纹解析或创建用户身份。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function identifyUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = validate(fingerprintSchema, req.body || {}, "request body");
    const user = await fileService.identifyUser(userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * 上传前通过浏览器指纹与文件 MD5 检查是否已存在同一文件。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回去重预检结果。
 */
export async function precheckFileUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(filePrecheckBodySchema, req.body || {}, "request body");
    const result = await fileService.precheckFileUpload(payload);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 创建文件元数据并同时创建 ingestion 任务。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回上传成功后的文件摘要。
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(uploadBodySchema, req.body || {}, "request body");
    if (!req.file) {
      throw createApiError(400, "VALIDATION_ERROR", "Invalid request body", [
        { path: "file", message: "Required" },
      ]);
    }

    const result = await fileService.uploadFile({
      userId: payload.userId,
      file: req.file,
    });
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 初始化分片上传会话。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回 uploadId 与已上传分片索引。
 */
export async function initChunkUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(chunkUploadInitBodySchema, req.body || {}, "request body");
    const result = await fileService.initChunkUpload({
      uploadId: payload.uploadId,
      userId: payload.userId,
      fileName: payload.fileName,
      fileSizeBytes: payload.fileSizeBytes,
      totalChunks: payload.totalChunks,
    });
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 接收单个分片并落盘。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回当前已上传分片索引。
 */
export async function uploadChunk(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(chunkUploadBodySchema, req.body || {}, "request body");
    if (!req.file) {
      throw createApiError(400, "VALIDATION_ERROR", "Invalid request body", [
        { path: "file", message: "Required" },
      ]);
    }

    const result = await fileService.uploadChunk({
      uploadId: payload.uploadId,
      chunkIndex: payload.chunkIndex,
      file: req.file,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 查询分片上传进度（用于断点续传）。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回已上传分片索引。
 */
export async function getChunkUploadStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { uploadId } = validate(chunkUploadStatusQuerySchema, req.query || {}, "query params");
    const result = await fileService.getChunkUploadStatus(uploadId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 完成分片上传并触发后续去重入库与向量化任务。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 返回上传成功后的文件摘要。
 */
export async function completeChunkUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(chunkUploadCompleteBodySchema, req.body || {}, "request body");
    const result = await fileService.completeChunkUpload(payload.uploadId);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 查询某个指纹用户下的文件列表。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function getFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validate(filesQuerySchema, req.query || {}, "query params");
    const files = await fileService.getFiles({
      userId: query.userId,
      parseStatus: query.parseStatus,
      page: query.page,
      limit: query.limit,
    });
    res.json({ data: files });
  } catch (error) {
    next(error);
  }
}

/**
 * 根据任务 ID 获取 ingestion 任务状态。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = validate(taskParamsSchema, req.params || {}, "path params");
    const task = await fileService.getTask(taskId);
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
}

export async function dispatchPendingFileIngestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { fileId } = validate(fileParamsSchema, req.params || {}, "path params");
    const { userId } = validate(fingerprintSchema, req.body || {}, "request body");
    const result = await fileService.dispatchPendingFileIngestion({ userId, fileId });
    res.status(202).json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 接收 AI 服务回调并更新任务/文件状态。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function ingestionCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(ingestionCallbackBodySchema, req.body || {}, "request body");
    const result = await fileService.handleIngestionCallback(payload);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function syncIngestionChunks(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(ingestionChunkSyncBodySchema, req.body || {}, "request body");
    const result = await fileService.syncIngestionChunks(payload);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function streamFileEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = validate(fingerprintSchema, req.query || {}, "query params");
    fileService.streamFileEvents(userId, res);
  } catch (error) {
    next(error);
  }
}
