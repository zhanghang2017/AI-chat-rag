/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-03-31 14:16:35
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-03-31 14:16:41
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/v1";

export function createApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

/**
 * 统一封装前端 API 请求，并解析后端标准 data/error 包装结构。
 * @param path 接口路径（以 / 开头）。
 * @param init fetch 请求配置。
 * @returns 业务数据对象。
 * @throws 当 HTTP 状态非 2xx 或返回结构不合法时抛出 Error。
 */
export async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(createApiUrl(path), init);
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.error?.message || `HTTP ${response.status}`);
  }

  if (!payload.data) {
    throw new Error("Invalid API response");
  }

  return payload.data;
}
