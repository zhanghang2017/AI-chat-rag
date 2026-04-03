/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-04-03 14:05:47
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-03 14:05:51
 */
import type { ChatMessageSource } from "../../api";
import MaterialIcon from "../common/MaterialIcon";

type CitationChipsProps = {
  sources: ChatMessageSource[];
};

const CitationChips = ({ sources }: CitationChipsProps) => {
  if (!sources.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source, index) => (
        <span
          key={`${source.fileId || source.fileName || "source"}-${index}`}
          className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600"
        >
          <MaterialIcon name="description" className="!text-[14px]" />
          {source.fileName || `Source ${index + 1}`}
          {typeof source.pageNumber === "number" ? ` p.${source.pageNumber}` : ""}
        </span>
      ))}
    </div>
  );
};

export default CitationChips;