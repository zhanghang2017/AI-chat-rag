import { createApiError } from "../common/errors";
import * as chatRepository from "../repositories/chat.repository";
import * as userRepository from "../repositories/user.repository";

/**
 * 为用户创建会话。
 * 会先执行用户 upsert，保证首次访问幂等。
 * @param payload 创建会话参数。
 * @returns 新创建的会话记录。
 */
export async function createChatSession(payload: { userId: string; title?: string }) {
  await userRepository.upsertUserById(payload.userId);
  return chatRepository.createSession(payload.userId, payload.title || null);
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

  return chatRepository.createMessage(payload.sessionId, payload.role, payload.content);
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

  return chatRepository.listMessages(payload.sessionId, payload.limit);
}
