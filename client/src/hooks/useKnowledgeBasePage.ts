import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIngestionEvents } from "../components/knowledge-base/IngestionEventProvider";
import {
  fetchKnowledgeBaseRows,
  requestIndexedFileOffload,
  requestKnowledgeFileDeletion,
  requestPendingFileIngestion,
  uploadFileToKnowledgeBase,
} from "../workservice/uploadWorkservice";
import type { KnowledgeBaseFilter, UploadLibraryRow } from "../workservice/uploadWorkservice";

/**
 * 聚合知识库列表页的分页、上传和文件操作状态，让路由文件只负责页面组装。
 * Aggregates pagination, upload, and row action state for the knowledge base
 * page so the route component only needs to compose screen sections.
 */
export function useKnowledgeBasePage() {
  const [rows, setRows] = useState<UploadLibraryRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<KnowledgeBaseFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("");
  const [dispatchingRowIds, setDispatchingRowIds] = useState<string[]>([]);
  const [offloadingRowIds, setOffloadingRowIds] = useState<string[]>([]);
  const [deletingRowIds, setDeletingRowIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queuedDispatchRowIdsRef = useRef<string[]>([]);
  const navigate = useNavigate();
  const { latestEvent } = useIngestionEvents();

  /**
   * 更新“已发起入库但后端状态尚未追平”的行 id 集合。
   * Updates the row id collection for files whose dispatch request has already
   * been sent but whose backend status has not caught up yet.
   *
   * @param nextIds 最新的待锁定行 id 列表。
   * @param nextIds The latest row ids that should remain locally locked.
   */
  function updateQueuedDispatchRowIds(nextIds: string[]) {
    queuedDispatchRowIdsRef.current = nextIds;
  }

  /**
   * 对指定行应用本地“处理中”覆盖状态，避免用户在后端状态刷新前重复点击 Dispatch。
   * Applies a local processing-state override to queued rows so users cannot
   * click Dispatch repeatedly before the backend status refresh arrives.
   *
   * @param nextRows 后端返回或当前内存中的表格行。
   * @param nextRows Table rows from the backend or current in-memory state.
   * @param queuedIds 需要持续锁定的行 id 列表。
   * @param queuedIds Row ids that should stay locally locked.
   * @returns 应用本地处理中状态后的新行列表。
   * @returns A new row list with the local processing override applied.
   */
  function applyQueuedDispatchState(nextRows: UploadLibraryRow[], queuedIds: string[]): UploadLibraryRow[] {
    const queuedSet = new Set(queuedIds);

    return nextRows.map((row) => {
      if (!queuedSet.has(row.id)) {
        return row;
      }

      return {
        ...row,
        status: "Processing",
        statusTone: "warning" as const,
        rawStatus: "processing" as const,
        canDispatch: false,
        canOffload: false,
        canDelete: false,
      };
    });
  }

  /**
   * 根据当前筛选、分页条件刷新知识库表格，并把本地 dispatch 锁重新合并到新结果中。
   * Refreshes the knowledge base table with the current filter and pagination,
   * then re-applies any local dispatch locks onto the latest result set.
   *
   * @param options 刷新选项；silent 为 true 时不显示整表 loading。
   * @param options Refresh options; when silent is true, full-table loading is skipped.
   */
  async function refreshRows(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoadingRows(true);
    }

    try {
      const nextRows = await fetchKnowledgeBaseRows(activeFilter, page, pageSize);
      const nextQueuedDispatchRowIds = queuedDispatchRowIdsRef.current.filter((id) => {
        const matchedRow = nextRows.rows.find((row) => row.id === id);
        return matchedRow ? matchedRow.rawStatus === "pending" || matchedRow.rawStatus === "failed" : false;
      });

      updateQueuedDispatchRowIds(nextQueuedDispatchRowIds);
      setRows(applyQueuedDispatchState(nextRows.rows, nextQueuedDispatchRowIds));
      setTotalPages(nextRows.pagination.totalPages);
      setTotalItems(nextRows.pagination.totalItems);
      setLoadError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load knowledge base files";
      setLoadError(message);
    } finally {
      if (!options?.silent) {
        setIsLoadingRows(false);
      }
    }
  }

  useEffect(() => {
    void refreshRows();
  }, [activeFilter, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (latestEvent?.type === "ingestion.updated") {
      void refreshRows({ silent: true });
    }
  }, [latestEvent]);

  /**
   * 处理用户选择的上传文件，串行执行上传并同步刷新知识库列表与上传进度提示。
   * Handles the selected files, uploads them sequentially, and keeps the
   * knowledge base list plus upload progress feedback in sync.
   *
   * @param files 用户从文件选择器中选中的文件集合。
   * @param files The file collection selected from the browser file picker.
   */
  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadPhase("");
    setUploadMessage("");

    for (const file of Array.from(files)) {
      setUploadProgress(0);
      setUploadPhase("hashing");
      setUploadMessage(`${file.name}: preparing upload...`);

      try {
        const result = await uploadFileToKnowledgeBase(file, {
          onUploadingProgress: (percent) => {
            const value = Math.floor(percent);
            setUploadProgress(value);
            setUploadMessage(`${file.name}: uploading ${value}%`);
          },
          onPhaseChange: (phase) => {
            setUploadPhase(phase);
            if (phase === "hashing") {
              setUploadProgress(0);
              setUploadMessage(`${file.name}: hashing...`);
            }
            if (phase === "uploading") {
              setUploadMessage(`${file.name}: uploading...`);
            }
            if (phase === "done") {
              setUploadProgress(100);
            }
          },
        });

        await refreshRows({ silent: true });
        setUploadPhase("done");
        setUploadProgress(100);
        setUploadMessage(
          result.alreadyExists
            ? `${file.name}: already exists in knowledge base`
            : `${file.name}: upload complete, waiting for indexing`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setUploadMessage(`${file.name}: ${message}`);
        setUploadPhase("failed");
      }
    }

    await refreshRows({ silent: true });
    setIsUploading(false);
  }

  /**
   * 发送单条文件的入库请求，并立即在本地把该行锁定为 processing，直到后端状态追平。
   * Sends the ingestion request for a single file and immediately locks that
   * row locally as processing until the backend status catches up.
   *
   * @param row 当前被点击 Dispatch 的表格行。
   * @param row The table row whose Dispatch action was clicked.
   */
  async function handleDispatchRow(row: UploadLibraryRow) {
    if (dispatchingRowIds.includes(row.id) || queuedDispatchRowIdsRef.current.includes(row.id)) {
      return;
    }

    const previousRows = rows;
    const nextQueuedDispatchRowIds = [...queuedDispatchRowIdsRef.current, row.id];

    setLoadError("");
    updateQueuedDispatchRowIds(nextQueuedDispatchRowIds);
    setDispatchingRowIds((current) => (current.includes(row.id) ? current : [...current, row.id]));
    setRows((current) => applyQueuedDispatchState(current, nextQueuedDispatchRowIds));

    try {
      await requestPendingFileIngestion(row.id);
      setUploadMessage(`${row.name}: indexing request sent`);
      await refreshRows({ silent: true });
    } catch (error) {
      updateQueuedDispatchRowIds(queuedDispatchRowIdsRef.current.filter((id) => id !== row.id));
      setRows(previousRows);
      const message = error instanceof Error ? error.message : "Failed to start ingestion";
      setLoadError(message);
    } finally {
      setDispatchingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  /**
   * 对已入库文件发起出库请求，并在成功后刷新表格状态。
   * Triggers an offload request for an indexed file and refreshes the table on success.
   *
   * @param row 当前要执行出库的表格行。
   * @param row The table row to offload from the knowledge base.
   */
  async function handleOffloadRow(row: UploadLibraryRow) {
    setLoadError("");
    setOffloadingRowIds((current) => (current.includes(row.id) ? current : [...current, row.id]));

    try {
      await requestIndexedFileOffload(row.id);
      setUploadMessage(`${row.name}: 已出库，可重新入库`);
      await refreshRows({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to offload file";
      setLoadError(message);
    } finally {
      setOffloadingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  /**
   * 删除指定文件，删除前弹出确认框，成功后刷新列表。
   * Deletes the selected file after confirmation and refreshes the list when done.
   *
   * @param row 当前要删除的表格行。
   * @param row The table row selected for deletion.
   */
  async function handleDeleteRow(row: UploadLibraryRow) {
    const confirmed = window.confirm(`确认删除文件 “${row.name}” 吗？`);
    if (!confirmed) {
      return;
    }

    setLoadError("");
    setDeletingRowIds((current) => (current.includes(row.id) ? current : [...current, row.id]));

    try {
      await requestKnowledgeFileDeletion(row.id);
      setUploadMessage(`${row.name}: 已删除`);
      await refreshRows({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete file";
      setLoadError(message);
    } finally {
      setDeletingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  /**
   * 打开已完成向量化的文件详情页；未 indexed 的文件不会响应跳转。
   * Opens the detail page for an indexed file; non-indexed rows are ignored.
   *
   * @param row 当前被点击的表格行。
   * @param row The table row that was clicked.
   */
  function handleOpenIndexedRow(row: UploadLibraryRow) {
    if (row.rawStatus !== "indexed") {
      return;
    }

    navigate(`/knowledge-base/files/${row.id}`);
  }

  /**
   * 跳转到聊天页。
   * Navigates to the chat page.
   */
  function handleOpenChat() {
    navigate("/chat");
  }

  /**
   * 跳转到知识库首页。
   * Navigates to the knowledge base landing page.
   */
  function handleOpenKnowledgeBase() {
    navigate("/knowledge-base");
  }

  /**
   * 打开隐藏的文件选择器，供上传面板按钮复用。
   * Opens the hidden file picker so the upload panel button can reuse it.
   */
  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  return {
    rows,
    activeFilter,
    page,
    pageSize,
    totalPages,
    totalItems,
    isLoadingRows,
    loadError,
    isUploading,
    uploadMessage,
    uploadProgress,
    uploadPhase,
    dispatchingRowIds,
    offloadingRowIds,
    deletingRowIds,
    fileInputRef,
    setActiveFilter,
    setPage,
    setPageSize,
    handleFilesSelected,
    handleDispatchRow,
    handleOffloadRow,
    handleDeleteRow,
    handleOpenIndexedRow,
    handleOpenChat,
    handleOpenKnowledgeBase,
    handleOpenFilePicker,
  };
}