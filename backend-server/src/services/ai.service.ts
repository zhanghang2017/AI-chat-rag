import { createApiError } from "../common/errors";

interface AiChatPayload {
  query: string;
  sessionId?: string;
  userId?: string;
  recentMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface AiChatResult {
  answer: string;
  sources?: unknown[];
}

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || "http://127.0.0.1:8000";
const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 12000);
const ingestionEndpoint = process.env.AI_INGESTION_ENDPOINT || `${AI_SERVICE_BASE_URL}/ingestion/jobs`;
const vectorDeleteEndpoint = process.env.AI_VECTOR_DELETE_ENDPOINT || `${AI_SERVICE_BASE_URL}/vectors/files`;
const aiServiceSharedSecret = process.env.AI_SERVICE_SHARED_SECRET || "";

function createAiServiceHeaders(extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    ...(extraHeaders || {}),
  };

  if (aiServiceSharedSecret) {
    headers["x-ai-service-secret"] = aiServiceSharedSecret;
  }

  return headers;
}

/**
 * 将聊天请求转发到 Python AI 服务，并统一上游异常语义。
 * @param payload AI 对话请求参数。
 * @returns AI 服务返回的回答与可选来源信息。
 * @throws AI_SERVICE_TIMEOUT 当请求超时。
 * @throws AI_SERVICE_ERROR 当 AI 服务返回非 2xx。
 * @throws AI_SERVICE_UNAVAILABLE 当网络不可用或服务不可达。
 */
export async function requestChat(payload: AiChatPayload): Promise<AiChatResult> {
  // AbortController prevents hung upstream calls from blocking Node workers.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_BASE_URL}/chat`, {
      method: "POST",
      headers: createAiServiceHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        ...payload,
        browserFingerprintHash: payload.userId,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createApiError(502, "AI_SERVICE_ERROR", `AI service returned ${response.status}`);
    }

    const data = (await response.json()) as AiChatResult;
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createApiError(504, "AI_SERVICE_TIMEOUT", "AI service timeout");
    }

    if ((error as { code?: string })?.code) {
      throw error;
    }

    throw createApiError(502, "AI_SERVICE_UNAVAILABLE", "AI service unavailable");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 向 Python AI 服务发起流式聊天请求。
 * @param payload AI 对话请求参数。
 * @returns 上游 Response 对象。
 */
export async function streamChat(payload: AiChatPayload): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: createAiServiceHeaders({
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      }),
      body: JSON.stringify({
        ...payload,
        browserFingerprintHash: payload.userId,
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw createApiError(502, "AI_SERVICE_ERROR", `AI service returned ${response.status}`);
    }

    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);

    if (error instanceof Error && error.name === "AbortError") {
      throw createApiError(504, "AI_SERVICE_TIMEOUT", "AI service timeout");
    }

    if ((error as { code?: string })?.code) {
      throw error;
    }

    throw createApiError(502, "AI_SERVICE_UNAVAILABLE", "AI service unavailable");
  }
}

/**
 * 异步派发向量化任务到 AI 服务。
 * @param payload 向量化任务参数。
 * @returns 无返回值。
 */
export async function dispatchIngestionTask(payload: {
  taskId: string;
  fileId: string;
  userId: string;
  fileName: string;
  fileExt: string;
  fileSizeBytes: number;
  contentMd5: string;
  storagePath: string;
  absoluteFilePath: string;
  parseVersion: number;
}) {
  if (!ingestionEndpoint) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      ...createAiServiceHeaders(),
      "Content-Type": "application/json",
    };

    await fetch(ingestionEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore dispatch failure here; worker can retry from pending tasks.
  }
}

/**
 * 删除某个文件在 AI 向量服务中的全部向量分块。
 * @param fileId 文件 ID。
 * @returns 无返回值。
 */
export async function deleteFileVectors(fileId: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);

  try {
    const headers = createAiServiceHeaders();

    const response = await fetch(`${vectorDeleteEndpoint}/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createApiError(502, "AI_SERVICE_ERROR", `AI service returned ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createApiError(504, "AI_SERVICE_TIMEOUT", "AI service timeout");
    }

    if ((error as { code?: string })?.code) {
      throw error;
    }

    throw createApiError(502, "AI_SERVICE_UNAVAILABLE", "AI service unavailable");
  } finally {
    clearTimeout(timer);
  }
}
