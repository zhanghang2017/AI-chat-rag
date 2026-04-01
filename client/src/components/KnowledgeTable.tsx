import MaterialIcon from "./MaterialIcon";
import type { KnowledgeBaseFilter, UploadLibraryRow } from "../workservice/uploadWorkservice";

const filterOptions: Array<{ value: KnowledgeBaseFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "indexed", label: "Indexed" },
];

const pageSizeOptions = [5, 10, 20];

type KnowledgeTableProps = {
  rows: UploadLibraryRow[];
  isLoading?: boolean;
  error?: string;
  activeFilter: KnowledgeBaseFilter;
  onFilterChange: (filter: KnowledgeBaseFilter) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  dispatchingRowIds?: string[];
  onDispatchRow?: (row: UploadLibraryRow) => void;
};

const KnowledgeTable = ({
  rows,
  isLoading = false,
  error = "",
  activeFilter,
  onFilterChange,
  page,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
  canGoPrevious,
  canGoNext,
  pageSize,
  onPageSizeChange,
  dispatchingRowIds = [],
  onDispatchRow,
}: KnowledgeTableProps) => {
  const emptyMessage = isLoading
    ? "Loading files..."
    : error || "No files have entered the knowledge base yet.";
  const dispatchingSet = new Set(dispatchingRowIds);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="font-headline text-lg font-bold">Library</h3>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400">
              <MaterialIcon name="filter_list" />
            </div>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === option.value
                    ? "border-black bg-black text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-black"
                }`}
                onClick={() => onFilterChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Rows</span>
            <select
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-black"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option} / page</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="overflow-hidden border-t border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 font-medium">Name</th>
              <th className="py-3 font-medium">Size</th>
              <th className="py-3 font-medium">Status</th>
              <th className="py-3 font-medium">Action</th>
              <th className="py-3 text-right font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length > 0 ? rows.map((row) => (
              <tr key={row.id} className="group transition-colors hover:bg-slate-50/50">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <MaterialIcon name={row.icon} className="text-slate-300" />
                    <span className="text-sm font-medium text-black">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-slate-500">{row.size}</td>
                <td className="py-3">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-tight ${
                      row.statusTone === "success"
                        ? "text-emerald-600"
                        : row.statusTone === "warning"
                          ? "text-amber-600"
                          : "text-rose-600"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="py-3">
                  {row.canDispatch ?
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d6c1a1] bg-[#fff6ea] text-[#7b5a28] transition-colors hover:border-[#b98b47] hover:bg-[#ffefd8] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={dispatchingSet.has(row.id)}
                      onClick={() => onDispatchRow?.(row)}
                      title={dispatchingSet.has(row.id) ? "Starting ingestion" : "Start ingestion"}
                      type="button"
                    >
                      <MaterialIcon
                        name={dispatchingSet.has(row.id) ? "progress_activity" : "play_arrow"}
                        className={dispatchingSet.has(row.id) ? "!text-[18px] animate-spin" : "!text-[18px]"}
                        filled={!dispatchingSet.has(row.id)}
                      />
                    </button>
                    : <span className="text-xs text-slate-300">-</span>}
                </td>
                <td className="py-3 text-right text-sm text-slate-400">{row.added}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-50 py-5">
          <p className="text-xs text-slate-400">{totalItems} files listed · Page {page} of {totalPages}</p>
          <div className="flex gap-4">
            <button
              className="text-xs font-semibold text-slate-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canGoPrevious}
              onClick={onPreviousPage}
              type="button"
            >
              Previous
            </button>
            <button
              className="text-xs font-semibold text-slate-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canGoNext}
              onClick={onNextPage}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeTable;
