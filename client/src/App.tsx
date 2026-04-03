import { Navigate, Route, Routes } from "react-router-dom";
import { IngestionEventProvider } from "./components/knowledge-base/IngestionEventProvider";
import AppShellLayout from "./components/layout/AppShellLayout";
import ChatPage from "./routes/ChatPage";
import KnowledgeBasePage from "./routes/KnowledgeBasePage";
import KnowledgeFileDetailPage from "./routes/KnowledgeFileDetailPage";

const App = () => {
  return (
    <IngestionEventProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route element={<AppShellLayout />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/knowledge-base/files/:fileId" element={<KnowledgeFileDetailPage />} />
        </Route>
      </Routes>
    </IngestionEventProvider>
  );
};

export default App;
