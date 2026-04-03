import type { KeyboardEvent } from "react";
import MaterialIcon from "../common/MaterialIcon";

type ChatComposerProps = {
  draft: string;
  isLoading: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

const ChatComposer = ({ draft, isLoading, onDraftChange, onSubmit }: ChatComposerProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSubmit();
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-8">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        <div className="relative flex items-center rounded-xl border border-slate-200 bg-white p-1.5 pl-4 shadow-sm transition-all focus-within:ring-1 focus-within:ring-black">
          <textarea
            rows={1}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the architect..."
            className="no-scrollbar h-[42px] flex-1 resize-none border-none bg-transparent px-0 py-2.5 text-sm focus:ring-0"
          />
          <button
            onClick={() => void onSubmit()}
            disabled={!draft.trim() || isLoading}
            className="flex items-center justify-center rounded-lg bg-black p-2 text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <MaterialIcon name="send" className="!text-[18px]" />
          </button>
        </div>
        <div className="mt-4 flex justify-center gap-6 opacity-40">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Knowledge-Grounded Streaming
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Session Context Enabled
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatComposer;