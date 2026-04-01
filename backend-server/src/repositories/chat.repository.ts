import { prisma } from "../lib/prisma";

/**
 * 为指定用户创建会话。
 * @param userId 用户 ID（浏览器指纹）。
 * @param title 会话标题（可为空）。
 * @returns 新创建的会话记录。
 */
export async function createSession(userId: string, title: string | null) {
  return prisma.chatSession.create({
    data: {
      userId,
      title,
    },
  });
}

/**
 * 查询会话列表（按创建时间倒序），并包含消息数量统计。
 * @param userId 用户 ID（浏览器指纹）。
 * @param limit 返回数量上限。
 * @returns 会话记录数组（含 _count）。
 */
export async function listSessions(userId: string, limit: number) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    // _count is transformed by service into messageCount.
    include: {
      _count: {
        select: { messages: true },
      },
    },
    take: limit,
  });
}

/**
 * 根据会话 ID 查询会话。
 * @param id 会话 ID。
 * @returns 会话记录；不存在时返回 null。
 */
export async function findSessionById(id: string) {
  return prisma.chatSession.findUnique({
    where: { id },
  });
}

/**
 * 在会话中创建一条消息。
 * @param sessionId 会话 ID。
 * @param role 消息角色（user 或 assistant）。
 * @param content 消息内容。
 * @returns 新创建的消息记录。
 */
export async function createMessage(sessionId: string, role: "user" | "assistant", content: string) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}

/**
 * 查询会话消息（按时间正序）。
 * @param sessionId 会话 ID。
 * @param limit 返回数量上限。
 * @returns 消息记录数组。
 */
export async function listMessages(sessionId: string, limit: number) {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
