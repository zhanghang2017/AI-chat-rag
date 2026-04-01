import { useEffect, useRef, useState } from "react";
import { useIngestionEvents } from "../components/IngestionEventProvider";
import LeftSidebar from "../components/LeftSidebar";
import KnowledgeTable from "../components/KnowledgeTable";
import MaterialIcon from "../components/MaterialIcon";
import TopHeader from "../components/TopHeader";
import {
  fetchKnowledgeBaseRows,
  requestPendingFileIngestion,
  uploadFileToKnowledgeBase,
} from "../workservice/uploadWorkservice";
import type { KnowledgeBaseFilter, UploadLibraryRow } from "../workservice/uploadWorkservice";

const KnowledgeBasePage = () => {
  const [rows, setRows] = useState<UploadLibraryRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<KnowledgeBaseFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<string>("");
  const [dispatchingRowIds, setDispatchingRowIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { latestEvent } = useIngestionEvents();

  async function refreshRows(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setIsLoadingRows(true);
    }

    try {
      const nextRows = await fetchKnowledgeBaseRows(activeFilter, page, pageSize);
      setRows(nextRows.rows);
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
  }, [activeFilter]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

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

  async function handleDispatchRow(row: UploadLibraryRow) {
    const previousRows = rows;

    setLoadError("");
    setDispatchingRowIds((current) => (current.includes(row.id) ? current : [...current, row.id]));
    setRows((current) => current.map((item) => {
      if (item.id !== row.id) {
        return item;
      }

      return {
        ...item,
        status: "Processing",
        statusTone: "warning",
        rawStatus: "processing",
        canDispatch: false,
      };
    }));

    try {
      await requestPendingFileIngestion(row.id);
      setUploadMessage(`${row.name}: indexing request sent`);
      await refreshRows({ silent: true });
    } catch (error) {
      setRows(previousRows);
      const message = error instanceof Error ? error.message : "Failed to start ingestion";
      setLoadError(message);
    } finally {
      setDispatchingRowIds((current) => current.filter((id) => id !== row.id));
    }
  }

  return (
    <div className="bg-white font-sans text-[#191c1e]">
      <TopHeader active="knowledge" />
      <LeftSidebar active="knowledge" showSettings />

      <main className="ml-0 min-h-screen px-6 pb-12 pt-20 md:ml-64 md:px-10 md:pb-10 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7">
            <h1 className="font-headline mb-1 text-3xl font-bold tracking-tight text-black">
              Knowledge Base
            </h1>
            <p className="text-sm text-slate-500">Upload and manage organizational data for RAG retrieval.</p>
          </div>

          <div className="space-y-7">
            <div className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-7 transition-all hover:border-slate-200 md:p-8">
              <div className="mb-3 text-slate-400 transition-colors group-hover:text-black">
                <MaterialIcon name="cloud_upload" className="!text-3xl" />
              </div>
              <h3 className="font-headline mb-1 text-lg font-semibold text-black">Upload Assets</h3>
              <p className="mb-4 text-sm text-slate-400">Drag and drop PDF, DOCX, or TXT files</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(event) => {
                  void handleFilesSelected(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <button
                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </button>

              {uploadPhase ?
                <div className="mt-3 w-full max-w-md">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-slate-500">{`${uploadPhase}: ${uploadProgress}%`}</p>
                </div>
                : null}

              {uploadMessage ? <p className="mt-2 text-xs text-slate-500">{uploadMessage}</p> : null}
            </div>

            <KnowledgeTable
              rows={rows}
              isLoading={isLoadingRows}
              error={loadError}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
              onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
              canGoPrevious={page > 1}
              canGoNext={page < totalPages}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              dispatchingRowIds={dispatchingRowIds}
              onDispatchRow={(row) => {
                void handleDispatchRow(row);
              }}
            />

            <div className="md:hidden fixed bottom-0 left-0 z-50 grid h-14 w-full grid-cols-2 border-t border-slate-100 bg-white">
              <button className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
                <MaterialIcon name="chat_bubble" className="!text-xl" />
                <span className="text-[9px] font-medium">Chat</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-0.5 text-black">
                <MaterialIcon name="database" className="!text-xl" filled />
                <span className="text-[9px] font-bold">Knowledge</span>
              </button>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default KnowledgeBasePage;
