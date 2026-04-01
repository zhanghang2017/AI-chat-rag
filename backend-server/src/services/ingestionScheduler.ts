type SchedulerRepository = {
  findTaskById: (taskId: string) => Promise<{
    id: string;
    fileId: string;
    status: string;
  } | null>;
  updateTaskById: (
    taskId: string,
    data: {
      status?: "queued" | "running" | "success" | "failed";
      progress?: number;
      errorMessage?: string | null;
    },
  ) => Promise<unknown>;
  updateFileById: (
    fileId: string,
    data: { parseStatus?: "pending" | "processing" | "failed" | "indexed" },
  ) => Promise<unknown>;
};

/**
 * 创建用于 MVP 的异步任务状态流转调度器。
 * @param repo 任务与文件状态读写能力集合。
 * @returns 包含 schedule 方法的调度器对象。
 */
export function createIngestionScheduler(repo: SchedulerRepository) {
  const runningDelayMs = Number(process.env.MOCK_INGEST_RUNNING_DELAY_MS || 800);
  const doneDelayMs = Number(process.env.MOCK_INGEST_DONE_DELAY_MS || 2200);
  const shouldFail = process.env.MOCK_INGEST_FAIL === "1";

  /**
    * 为指定任务注册异步状态流转。
    * @param taskId 任务 ID。
    * @returns 无返回值。
   */
  function schedule(taskId: string) {
    // Phase 1: queued -> running
    setTimeout(async () => {
      try {
        const runningTask = await repo.findTaskById(taskId);
        if (!runningTask || runningTask.status !== "queued") {
          return;
        }

        await repo.updateTaskById(taskId, {
          status: "running",
          progress: 35,
          errorMessage: null,
        });

        await repo.updateFileById(runningTask.fileId, {
          parseStatus: "processing",
        });
      } catch (error) {
        console.error("Failed to mark ingestion task as running", error);
      }
    }, runningDelayMs);

    // Phase 2: running -> success | failed
    setTimeout(async () => {
      try {
        const task = await repo.findTaskById(taskId);
        if (!task || task.status !== "running") {
          return;
        }

        if (shouldFail) {
          await repo.updateTaskById(taskId, {
            status: "failed",
            progress: 100,
            errorMessage: "Mock ingestion failed by MOCK_INGEST_FAIL",
          });

          await repo.updateFileById(task.fileId, {
            parseStatus: "failed",
          });
          return;
        }

        await repo.updateTaskById(taskId, {
          status: "success",
          progress: 100,
          errorMessage: null,
        });

        await repo.updateFileById(task.fileId, {
          parseStatus: "indexed",
        });
      } catch (error) {
        console.error("Failed to finalize ingestion task", error);
      }
    }, doneDelayMs);
  }

  return { schedule };
}
