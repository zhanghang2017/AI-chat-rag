import { useNavigate } from "react-router-dom";
import MaterialIcon from "../common/MaterialIcon";

type LeftSidebarProps = {
  active: "chat" | "knowledge";
  onNewChat?: () => void;
};

const LeftSidebar = ({ active, onNewChat }: LeftSidebarProps) => {
  const navigate = useNavigate();

  const linkClass = (isActive: boolean) =>
    isActive
      ? "bg-slate-100 text-black rounded-lg px-4 py-2 flex items-center gap-3 transition-all text-sm font-semibold"
      : "text-slate-500 px-4 py-2 flex items-center gap-3 hover:bg-slate-50 rounded-lg transition-all text-sm font-medium";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 shrink-0 flex-col gap-2 border-r border-slate-100 bg-white p-6 pt-24">
      <button
        onClick={onNewChat}
        className="mb-8 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-slate-50"
      >
        <MaterialIcon name="add" className="!text-[18px]" />
        New Chat
      </button>
      <nav className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className={linkClass(active === "chat")}
        >
          <MaterialIcon name="chat_bubble" filled={active === "chat"} />
          AI Chat
        </button>
        <button
          type="button"
          onClick={() => navigate("/knowledge-base")}
          className={linkClass(active === "knowledge")}
        >
          <MaterialIcon name="database" filled={active === "knowledge"} />
          Knowledge Base
        </button>
      </nav>
    </aside>
  );
};

export default LeftSidebar;