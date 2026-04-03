import { useEffect, useState } from "react";
import type { ChatSession } from "../../api";
import MaterialIcon from "../common/MaterialIcon";

type ChatHistoryDrawerProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<boolean>;
  onDeleteSelected: (sessionIds: string[]) => Promise<boolean>;
};

function resolveDayLabel(isoDate: string) {
  const createdAt = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();

  if (sameDay(createdAt, today)) {
    return "Today";
  }

  if (sameDay(createdAt, yesterday)) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(createdAt);
}

const ChatHistoryDrawer = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onDeleteSelected,
}: ChatHistoryDrawerProps) => {
  // 抽屉内部维护“多选模式”和勾选集合，这些状态只服务于当前 UI 展示。
  // The drawer owns selection mode and checked ids because they are local UI concerns.
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  useEffect(() => {
    // 当外部会话列表变化时，清理已经不存在的勾选项，避免抽屉保留脏状态。
    // Prune deleted session ids whenever the external session list changes.
    const sessionIds = new Set(sessions.map((session) => session.id));
    setSelectedSessionIds((current) => current.filter((id) => sessionIds.has(id)));
  }, [sessions]);

  const groupedSessions = sessions.reduce<Record<string, ChatSession[]>>((accumulator, session) => {
    const label = resolveDayLabel(session.createdAt);
    accumulator[label] = accumulator[label] || [];
    accumulator[label].push(session);
    return accumulator;
  }, {});
  const hasSelections = selectedSessionIds.length > 0;

  function handleToggleSelectionMode() {
    setIsSelectionMode((current) => !current);
    setSelectedSessionIds([]);
  }

  function handleToggleSessionSelection(sessionId: string) {
    setSelectedSessionIds((current) => (
      current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId]
    ));
  }

  async function handleDeleteSingleSession(sessionId: string) {
    const didDelete = await onDeleteSession(sessionId);
    if (didDelete) {
      setSelectedSessionIds((current) => current.filter((id) => id !== sessionId));
    }
  }

  async function handleDeleteSelectedSessions() {
    if (!selectedSessionIds.length) {
      return;
    }

    const didDelete = await onDeleteSelected(selectedSessionIds);
    if (didDelete) {
      setSelectedSessionIds([]);
      setIsSelectionMode(false);
    }
  }

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-100 bg-white xl:flex">
      <div className="border-b border-slate-50 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline mb-1 text-lg font-bold tracking-tight text-black">Recent Research</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Chat History</p>
          </div>
          <button
            onClick={handleToggleSelectionMode}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50"
          >
            {isSelectionMode ? "Cancel" : "Select"}
          </button>
        </div>
        {isSelectionMode ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-xs font-medium text-slate-500">{selectedSessionIds.length} selected</span>
            <button
              onClick={() => void handleDeleteSelectedSessions()}
              disabled={!hasSelections}
              className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Delete Selected
            </button>
          </div>
        ) : null}
      </div>
      <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto p-4">
        {Object.entries(groupedSessions).map(([label, items]) => (
          <section key={label}>
            <h3 className="mb-4 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</h3>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.id === activeSessionId;
                const isSelected = selectedSessionIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-slate-50 font-semibold text-black"
                        : "font-medium text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {isSelectionMode ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSessionSelection(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                      />
                    ) : null}
                    <button
                      onClick={() => onSelectSession(item.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <MaterialIcon
                        name="description"
                        className={isActive ? "!text-slate-300" : "!text-slate-200"}
                      />
                      <span className="line-clamp-2">{item.title || "New chat"}</span>
                    </button>
                    <button
                      onClick={() => void handleDeleteSingleSession(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-rose-500"
                      aria-label="Delete chat session"
                    >
                      <MaterialIcon name="delete" className="!text-[18px]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
};

export default ChatHistoryDrawer;