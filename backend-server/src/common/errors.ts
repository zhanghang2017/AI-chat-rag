import type { NextFunction, Request, Response } from "express";

export type ApiError = Error & {
  status?: number;
  code?: string;
  details?: unknown;
};

/**
 * 创建标准化 API 错误对象，供全局错误中间件统一处理。
 * @param status HTTP 状态码。
 * @param code 业务错误码。
 * @param message 对外错误消息。
 * @param details 可选的结构化错误详情。
 * @returns 可被错误处理中间件识别的 ApiError。
 */
export function createApiError(status: number, code: string, message: string, details?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * 向客户端返回统一的错误响应结构。
 * @param res Express 响应对象。
 * @param status HTTP 状态码。
 * @param code 业务错误码。
 * @param message 对外错误消息。
 * @param details 可选的结构化错误详情。
 * @returns Express 响应对象。
 */
export function sendApiError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const payload: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      code,
      message,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
}

/**
 * Express 全局错误中间件，负责错误码映射与兜底响应。
 * @param error 捕获到的错误对象。
 * @param _req Express 请求对象（当前未使用）。
 * @param res Express 响应对象。
 * @param _next Express next（当前未使用）。
 * @returns 已写入的错误响应。
 */
export function errorHandler(error: ApiError, _req: Request, res: Response, _next: NextFunction) {
  // Prisma not-found write operations map to a domain-neutral 404 response.
  if (error && error.code === "P2025") {
    return sendApiError(res, 404, "RESOURCE_NOT_FOUND", "Resource not found");
  }

  if (error && error.code && error.status) {
    return sendApiError(res, error.status, error.code, error.message, error.details);
  }

  // Hide unknown runtime errors behind a generic 500 response.
  console.error(error);
  return sendApiError(res, 500, "INTERNAL_SERVER_ERROR", "Internal server error");
}
