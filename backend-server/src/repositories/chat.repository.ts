import { prisma } from "../lib/prisma";

type ChatMessageSource = {
  fileId?: string;
  fileName?: string;
  pageNumber?: number | null;
  chunkIndex?: number | null;
  snippet?: string;
};

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
 * 根据会话 ID 和用户 ID 查询会话。
 * @param id 会话 ID。
 * @param userId 用户 ID。
 * @returns 匹配的会话记录；不存在时返回 null。
 */
export async function findSessionByIdAndUserId(id: string, userId: string) {
  return prisma.chatSession.findFirst({
    where: {
      id,
      userId,
    },
  });
}

/**
 * 在会话中创建一条消息。
 * @param sessionId 会话 ID。
 * @param role 消息角色（user 或 assistant）。
 * @param content 消息内容。
 * @returns 新创建的消息记录。
 */
export async function createMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  sources?: ChatMessageSource[],
) {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      sourcesJson: sources && sources.length ? JSON.stringify(sources) : null,
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

/**
 * 查询最近 N 条消息，并按时间正序返回。
 * @param sessionId 会话 ID。
 * @param limit 返回数量上限。
 * @returns 最近消息数组。
 */
export async function listRecentMessages(sessionId: string, limit: number) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.reverse();
}

/**
 * 删除单个会话。
 * ChatMessage 依赖 Prisma 关系上的 onDelete: Cascade 自动清理。
 * @param id 会话 ID。
 * @returns 删除后的会话记录。
 */
export async function deleteSession(id: string) {
  return prisma.chatSession.delete({
    where: { id },
  });
}

/**
 * 按用户范围批量删除会话。
 * @param userId 用户 ID。
 * @param sessionIds 待删除的会话 ID 列表。
 * @returns 删除数量。
 */
export async function deleteSessionsByIds(userId: string, sessionIds: string[]) {
  return prisma.chatSession.deleteMany({
    where: {
      userId,
      id: {
        in: sessionIds,
      },
    },
  });
}
