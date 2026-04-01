import { prisma } from "../lib/prisma";

/**
 * 根据任务 ID 查询 ingestion 任务。
 * @param taskId 任务 ID。
 * @returns 任务记录；不存在时返回 null。
 */
export async function findTaskById(taskId: string) {
  return prisma.ingestionTask.findUnique({
    where: { id: taskId },
  });
}

export async function findLatestTaskByFileId(fileId: string) {
  return prisma.ingestionTask.findFirst({
    where: { fileId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 更新 ingestion 任务运行时字段（状态、进度、错误信息）。
 * @param taskId 任务 ID。
 * @param data 待更新字段。
 * @returns 更新后的任务记录。
 */
export async function updateTaskById(
  taskId: string,
  data: {
    status?: "queued" | "running" | "success" | "failed" | "cancelled";
    progress?: number;
    errorMessage?: string | null;
  },
) {
  return prisma.ingestionTask.update({
    where: { id: taskId },
    data,
  });
}
