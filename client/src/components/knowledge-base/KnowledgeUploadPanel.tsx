import type { RefObject } from "react";
import MaterialIcon from "../common/MaterialIcon";

type KnowledgeUploadPanelProps = {
  fileInputRef: RefObject<HTMLInputElement>;
  isUploading: boolean;
  uploadMessage: string;
  uploadProgress: number;
  uploadPhase: string;
  onFilesSelected: (files: FileList | null) => void | Promise<void>;
  onOpenFilePicker: () => void;
};

const KnowledgeUploadPanel = ({
  fileInputRef,
  isUploading,
  uploadMessage,
  uploadProgress,
  uploadPhase,
  onFilesSelected,
  onOpenFilePicker,
}: KnowledgeUploadPanelProps) => {
  return (
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
          void onFilesSelected(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <button
        className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isUploading}
        onClick={onOpenFilePicker}
      >
        Select Files
      </button>

      {uploadPhase ? (
        <div className="mt-3 w-full max-w-md">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-xs text-slate-500">{`${uploadPhase}: ${uploadProgress}%`}</p>
        </div>
      ) : null}

      {uploadMessage ? <p className="mt-2 text-xs text-slate-500">{uploadMessage}</p> : null}
    </div>
  );
};

export default KnowledgeUploadPanel;