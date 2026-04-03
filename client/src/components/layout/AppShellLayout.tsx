/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-04-03 15:31:46
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-03 15:31:53
 */
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";
import TopHeader from "./TopHeader";

function resolveActiveSection(pathname: string): "chat" | "knowledge" {
  return pathname.startsWith("/knowledge-base") ? "knowledge" : "chat";
}

const AppShellLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = resolveActiveSection(location.pathname);

  return (
    <div className="bg-white font-sans text-[#191c1e]">
      <TopHeader active={active} />
      <LeftSidebar
        active={active}
        onNewChat={() => {
          navigate("/chat", { state: { startNewChatAt: Date.now() } });
        }}
      />
      <div className="pt-16 md:pl-64">
        <Outlet />
      </div>
    </div>
  );
};

export default AppShellLayout;