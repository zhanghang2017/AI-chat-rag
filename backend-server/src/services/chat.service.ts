import { createApiError } from "../common/errors";
import * as chatRepository from "../repositories/chat.repository";
import * as userRepository from "../repositories/user.repository";

type ChatMessageSource = {
  fileId?: string;
  fileName?: string;
  pageNumber?: number | null;
  chunkIndex?: number | null;
  snippet?: string;
};

function parseSourcesJson(value: string | null | undefined): ChatMessageSource[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as ChatMessageSource[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapMessageRecord<T extends { sourcesJson?: string | null }>(message: T) {
  return {
    ...message,
    sources: parseSourcesJson(message.sourcesJson),
  };
}

/**
 * 为用户创建会话。
 * 会先执行用户 upsert，保证首次访问幂等。
 * @param payload 创建会话参数。
 * @returns 新创建的会话记录。
 */
export async function createChatSession(payload: { userId: string; title?: string }) {
  await userRepository.upsertUserById(payload.userId);
  const session = await chatRepository.createSession(payload.userId, payload.title || null);
  return {
    ...session,
    messageCount: 0,
  };
}

/**
 * 查询用户下的会话列表。
 * 当用户不存在时返回空数组。
 * @param query 查询参数（用户 ID 和数量限制）。
 * @returns 会话列表（包含 messageCount）。
 */
export async function getChatSessions(query: { userId: string; limit: number }) {
  const sessions = await chatRepository.listSessions(query.userId, query.limit);
  // Flatten Prisma _count to a stable API field for frontend consumption.
  return sessions.map((session) => ({
    ...session,
    messageCount: session._count.messages,
    _count: undefined,
  }));
}

/**
 * 向指定会话新增一条消息。
 * @param payload 会话消息参数。
 * @returns 新创建的消息记录。
 * @throws SESSION_NOT_FOUND 当会话不存在时抛出。
 */
export async function createChatMessage(payload: { sessionId: string; role: "user" | "assistant"; content: string }) {
  const session = await chatRepository.findSessionById(payload.sessionId);
  if (!session) {
    throw createApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }

  const message = await chatRepository.createMessage(payload.sessionId, payload.role, payload.content);
  return mapMessageRecord(message);
}

/**
 * 查询会话消息列表。
 * @param payload 查询参数（会话 ID 与数量限制）。
 * @returns 消息列表。
 * @throws SESSION_NOT_FOUND 当会话不存在时抛出。
 */
export async function getChatMessages(payload: { sessionId: string; limit: number }) {
  const session = await chatRepository.findSessionById(payload.sessionId);
  if (!session) {
    throw createApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }

  const messages = await chatRepository.listMessages(payload.sessionId, payload.limit);
  return messages.map(mapMessageRecord);
}

/**
 * 校验会话是否属于指定用户。
 * @param payload 会话 ID 与用户 ID。
 * @returns 匹配的会话记录。
 */
export async function requireOwnedSession(payload: { sessionId: string; userId: string }) {
  const session = await chatRepository.findSessionByIdAndUserId(payload.sessionId, payload.userId);
  if (!session) {
    throw createApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }

  return session;
}

/**
 * 读取最近几轮消息，供 AI 上游使用。
 * @param payload 会话 ID 与上限。
 * @returns 最近消息列表。
 */
export async function getRecentChatMessages(payload: { sessionId: string; limit: number }) {
  const messages = await chatRepository.listRecentMessages(payload.sessionId, payload.limit);
  return messages.map(mapMessageRecord);
}

/**
 * 创建 assistant 消息并保存来源元数据。
 * @param payload assistant 消息参数。
 * @returns 新消息记录。
 */
export async function createAssistantMessage(payload: {
  sessionId: string;
  content: string;
  sources?: ChatMessageSource[];
}) {
  const message = await chatRepository.createMessage(
    payload.sessionId,
    "assistant",
    payload.content,
    payload.sources,
  );

  return mapMessageRecord(message);
}

/**
 * 删除单个会话。
 * @param payload 会话 ID 与用户 ID。
 * @returns 被删除会话的 ID。
 */
export async function deleteChatSession(payload: { sessionId: string; userId: string }) {
  await requireOwnedSession(payload);
  const deleted = await chatRepository.deleteSession(payload.sessionId);
  return {
    id: deleted.id,
  };
}

/**
 * 批量删除多个会话。
 * 仅删除当前用户拥有的会话；关联消息通过数据库级联删除。
 * @param payload 用户 ID 与会话 ID 列表。
 * @returns 删除数量。
 */
export async function deleteChatSessions(payload: { userId: string; sessionIds: string[] }) {
  if (!payload.sessionIds.length) {
    return { deletedCount: 0 };
  }

  const result = await chatRepository.deleteSessionsByIds(payload.userId, payload.sessionIds);
  return {
    deletedCount: result.count,
  };
}
