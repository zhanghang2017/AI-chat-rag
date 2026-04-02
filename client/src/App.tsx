import { Navigate, Route, Routes } from "react-router-dom";
import { IngestionEventProvider } from "./components/IngestionEventProvider";
import ChatPage from "./routes/ChatPage";
import KnowledgeBasePage from "./routes/KnowledgeBasePage";
import KnowledgeFileDetailPage from "./routes/KnowledgeFileDetailPage";

const App = () => {
  return (
    <IngestionEventProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/knowledge-base/files/:fileId" element={<KnowledgeFileDetailPage />} />
      </Routes>
    </IngestionEventProvider>
  );
};

export default App;
