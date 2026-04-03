import { useNavigate } from "react-router-dom";

type TopHeaderProps = {
  active: "chat" | "knowledge";
};

const TopHeader = ({ active }: TopHeaderProps) => {
  const navigate = useNavigate();

  const navClass = (isActive: boolean) =>
    isActive
      ? "text-black font-semibold text-sm border-b-2 border-black h-16 flex items-center"
      : "text-slate-400 font-medium text-sm hover:text-black transition-colors h-16 flex items-center";

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-12">
        <span className="font-headline text-lg font-bold tracking-tight text-black">Cognitive Architect</span>
        <nav className="hidden h-full items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className={navClass(active === "chat")}
          >
            AI Chat
          </button>
          <button
            type="button"
            onClick={() => navigate("/knowledge-base")}
            className={navClass(active === "knowledge")}
          >
            Knowledge Base
          </button>
        </nav>
      </div>
      <div className="hidden items-center gap-4 lg:flex">
        <input
          type="text"
          placeholder="Search..."
          className="w-48 rounded-lg border border-slate-100 bg-slate-50 px-4 py-1.5 text-sm outline-none transition-all focus:ring-1 focus:ring-black"
        />
      </div>
    </header>
  );
};

export default TopHeader;