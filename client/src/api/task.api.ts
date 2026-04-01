/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-03-31 14:16:58
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-03-31 14:16:58
 */
import { requestApi } from "./httpClient";

export type TaskInfo = {
  id: string;
  status: string;
  progress: number;
};

/**
 * 根据任务 ID 查询 ingestion 任务进度。
 * @param taskId 任务 ID。
 * @returns 任务状态与进度。
 */
export async function getTaskById(taskId: string): Promise<TaskInfo> {
  return requestApi<TaskInfo>(`/tasks/${encodeURIComponent(taskId)}`);
}
