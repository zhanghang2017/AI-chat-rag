import KnowledgeTable from "./KnowledgeTable";
import KnowledgeUploadPanel from "./KnowledgeUploadPanel";
import type { KnowledgeBaseFilter, UploadLibraryRow } from "../../workservice/uploadWorkservice";
import type { RefObject } from "react";
import MaterialIcon from "../common/MaterialIcon";

type KnowledgeBaseContentProps = {
  rows: UploadLibraryRow[];
  activeFilter: KnowledgeBaseFilter;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  isLoadingRows: boolean;
  loadError: string;
  isUploading: boolean;
  uploadMessage: string;
  uploadProgress: number;
  uploadPhase: string;
  dispatchingRowIds: string[];
  offloadingRowIds: string[];
  deletingRowIds: string[];
  fileInputRef: RefObject<HTMLInputElement>;
  onFilterChange: (filter: KnowledgeBaseFilter) => void;
  onPageChange: (updater: number | ((current: number) => number)) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFilesSelected: (files: FileList | null) => void | Promise<void>;
  onOpenFilePicker: () => void;
  onOpenIndexedRow: (row: UploadLibraryRow) => void;
  onDispatchRow: (row: UploadLibraryRow) => void | Promise<void>;
  onOffloadRow: (row: UploadLibraryRow) => void | Promise<void>;
  onDeleteRow: (row: UploadLibraryRow) => void | Promise<void>;
  onOpenChat: () => void;
  onOpenKnowledgeBase: () => void;
};

const KnowledgeBaseContent = ({
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
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  onFilesSelected,
  onOpenFilePicker,
  onOpenIndexedRow,
  onDispatchRow,
  onOffloadRow,
  onDeleteRow,
  onOpenChat,
  onOpenKnowledgeBase,
}: KnowledgeBaseContentProps) => {
  return (
    <section className="min-h-[calc(100vh-4rem)] px-6 pb-24 pt-4 md:px-10 md:pb-10 md:pt-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <h1 className="font-headline mb-1 text-3xl font-bold tracking-tight text-black">
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500">Upload and manage organizational data for RAG retrieval.</p>
        </div>

        <div className="space-y-7">
          <KnowledgeUploadPanel
            fileInputRef={fileInputRef}
            isUploading={isUploading}
            uploadMessage={uploadMessage}
            uploadProgress={uploadProgress}
            uploadPhase={uploadPhase}
            onFilesSelected={onFilesSelected}
            onOpenFilePicker={onOpenFilePicker}
          />

          <KnowledgeTable
            rows={rows}
            isLoading={isLoadingRows}
            error={loadError}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPreviousPage={() => onPageChange((current) => Math.max(1, current - 1))}
            onNextPage={() => onPageChange((current) => Math.min(totalPages, current + 1))}
            canGoPrevious={page > 1}
            canGoNext={page < totalPages}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            dispatchingRowIds={dispatchingRowIds}
            offloadingRowIds={offloadingRowIds}
            deletingRowIds={deletingRowIds}
            onOpenIndexedRow={onOpenIndexedRow}
            onDispatchRow={(row) => {
              void onDispatchRow(row);
            }}
            onOffloadRow={(row) => {
              void onOffloadRow(row);
            }}
            onDeleteRow={(row) => {
              void onDeleteRow(row);
            }}
          />

          <div className="fixed bottom-0 left-0 z-50 grid h-14 w-full grid-cols-2 border-t border-slate-100 bg-white md:hidden">
            <button
              type="button"
              onClick={onOpenChat}
              className="flex flex-col items-center justify-center gap-0.5 text-slate-400"
            >
              <MaterialIcon name="chat_bubble" className="!text-xl" />
              <span className="text-[9px] font-medium">Chat</span>
            </button>
            <button
              type="button"
              onClick={onOpenKnowledgeBase}
              className="flex flex-col items-center justify-center gap-0.5 text-black"
            >
              <MaterialIcon name="database" className="!text-xl" filled />
              <span className="text-[9px] font-bold">Knowledge</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KnowledgeBaseContent;