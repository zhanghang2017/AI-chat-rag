import type { NextFunction, Request, Response } from "express";
import { sendApiError } from "../common/errors";

/**
 * 校验请求中是否包含 userId（兼容旧字段 browserFingerprintHash），避免下游处理缺少用户标识。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 当指纹缺失时直接返回错误响应，否则进入下一个中间件。
 */
export function requireFingerprint(req: Request, res: Response, next: NextFunction) {
  // Accept user ID from either body or query and keep old field for compatibility.
  const fromBody = req.body?.userId || req.body?.browserFingerprintHash;
  const fromQuery = req.query?.userId || req.query?.browserFingerprintHash;

  const fingerprint =
    (typeof fromBody === "string" && fromBody.trim()) ||
    (typeof fromQuery === "string" && fromQuery.trim()) ||
    "";

  if (!fingerprint) {
    return sendApiError(res, 400, "VALIDATION_ERROR", "Invalid fingerprint", [
      { path: "userId", message: "Required" },
    ]);
  }

  next();
}
