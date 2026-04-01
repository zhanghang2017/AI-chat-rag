import { historyItems } from "../data/mockData";
import MaterialIcon from "./MaterialIcon";

const ChatHistoryDrawer = () => {
  const todayItems = historyItems.filter((item) => item.day === "Today");
  const yesterdayItems = historyItems.filter((item) => item.day === "Yesterday");

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-100 bg-white xl:flex">
      <div className="border-b border-slate-50 p-8">
        <h2 className="font-headline mb-1 text-lg font-bold tracking-tight text-black">Recent Research</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Chat History</p>
      </div>
      <div className="no-scrollbar flex-1 space-y-8 overflow-y-auto p-4">
        <section>
          <h3 className="mb-4 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Today</h3>
          <div className="space-y-1">
            {todayItems.map((item) => (
              <button
                key={item.title}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  item.active
                    ? "bg-slate-50 font-semibold text-black"
                    : "font-medium text-slate-500 hover:bg-slate-50"
                }`}
              >
                <MaterialIcon
                  name="description"
                  className={item.active ? "!text-slate-300" : "!text-slate-200"}
                />
                {item.title}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-4 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Yesterday</h3>
          <div className="space-y-1">
            {yesterdayItems.map((item) => (
              <button
                key={item.title}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                <MaterialIcon name="description" className="!text-slate-200" />
                {item.title}
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="border-t border-slate-50 p-6">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Storage</span>
            <span className="text-[10px] font-bold text-black">82%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[82%] rounded-full bg-black"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatHistoryDrawer;
