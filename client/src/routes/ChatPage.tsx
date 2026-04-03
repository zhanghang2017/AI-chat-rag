import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ChatMessage, ChatSession } from "../api";
import ChatComposer from "../components/chat/ChatComposer";
import ChatHistoryDrawer from "../components/chat/ChatHistoryDrawer";
import ChatMessageList from "../components/chat/ChatMessageList";
import { useChatSubmit } from "../hooks/useChatSubmit";
import {
  loadChatSessions,
  loadSessionMessages,
  removeChatSession,
  removeChatSessions,
} from "../workservice/chatWorkservice";

/**
 * 聊天路由容器，负责管理会话、处理流式消息，并协调聊天页面的各个子组件。
 * Chat route container responsible for session management, message streaming,
 * and coordinating the chat layout subcomponents.
 */
const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const skipNextSessionLoadRef = useRef<string | null>(null);
  const startNewChatAt =
    typeof location.state === "object"
    && location.state !== null
    && "startNewChatAt" in location.state
    && typeof location.state.startNewChatAt === "number"
      ? location.state.startNewChatAt
      : null;

  // 历史抽屉中展示的全部聊天会话，按最近使用时间排序。
  // All chat sessions shown in the history drawer, ordered by recency.
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  // 当前选中的会话 id，用于展示消息并作为新消息发送目标。
  // Session currently selected for viewing and sending new messages.
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 主会话区域当前渲染的消息列表。
  // Messages currently rendered in the main conversation panel.
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 底部输入框当前的草稿内容。
  // Current text entered in the bottom composer.
  const [draft, setDraft] = useState("");

  // 流式请求进行中时的加载状态，用来锁定输入区避免重复提交。
  // Loading flag used to lock the composer during a streaming request.
  const [isLoading, setIsLoading] = useState(false);

  // 最近一次可恢复错误，会在对话面板中反馈给用户。
  // Latest recoverable error surfaced to the user in the conversation panel.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 是否处于“新聊天”空白态；该状态下不应自动选中历史会话。
  // Whether the page is in blank new-chat mode; when true, history auto-select is suppressed.
  const [isNewChatMode, setIsNewChatMode] = useState(false);

  const { handleSubmit } = useChatSubmit({
    activeSessionId,
    draft,
    isLoading,
    onSessionCreated: (sessionId) => {
      skipNextSessionLoadRef.current = sessionId;
    },
    setActiveSessionId,
    setSessions,
    setMessages,
    setDraft,
    setIsLoading,
    setErrorMessage,
  });

  useEffect(() => {
    let cancelled = false;

    /**
     * 页面首次挂载时加载已保存的聊天会话，并默认打开最新会话，确保用户进入页面即可继续对话。
     * Loads the saved chat sessions when the page first mounts and opens the
     * newest session by default so the user lands on a usable conversation.
     */
    async function bootstrap() {
      const nextSessions = await loadChatSessions();
      if (cancelled) {
        return;
      }

      setSessions(nextSessions);
      if (!startNewChatAt && !isNewChatMode && nextSessions[0]) {
        setActiveSessionId(nextSessions[0].id);
      }
    }

    void bootstrap().catch((error: unknown) => {
      if (!cancelled) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load chat sessions");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isNewChatMode, startNewChatAt]);

  useEffect(() => {
    if (!startNewChatAt) {
      return;
    }

    handleCreateSession();
    navigate("/chat", { replace: true, state: null });
  }, [navigate, startNewChatAt]);

  useEffect(() => {
    if (activeSessionId) {
      setIsNewChatMode(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const sessionId = activeSessionId;
    if (skipNextSessionLoadRef.current === sessionId) {
      skipNextSessionLoadRef.current = null;
      return;
    }

    let cancelled = false;

    /**
     * 根据历史抽屉当前选中的会话拉取消息，保证主消息区与当前会话保持同步。
     * Fetches messages for the session selected in the history drawer and keeps
     * the main panel aligned with the current session id.
     */
    async function loadMessages() {
      const nextMessages = await loadSessionMessages(sessionId);
      if (!cancelled) {
        setMessages(nextMessages);
      }
    }

    void loadMessages().catch((error: unknown) => {
      if (!cancelled) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load messages");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  /**
   * 将页面重置为“新聊天”状态，但此时不会立刻创建持久化会话；真正的会话会在首次发送消息时创建。
   * Resets the page into a new-chat state without immediately creating a
   * persisted session. The actual session is created on the first message send.
   */
  function handleCreateSession() {
    setIsNewChatMode(true);
    setActiveSessionId(null);
    setMessages([]);
    setErrorMessage(null);
  }

  /**
   * 选中历史会话时退出“新聊天”空白态。
   * Exits blank new-chat mode when the user selects a session from history.
   */
  function handleSelectSession(sessionId: string) {
    setIsNewChatMode(false);
    setActiveSessionId(sessionId);
  }

  /**
   * 在删除一个或多个会话后，决定哪个会话应继续保持激活；如果当前会话未被删除则继续保留，
   * 否则回退到剩余会话中最新的一条。
   * Chooses which session should stay active after one or more sessions have
   * been deleted. If the current session survives, keep it selected; otherwise
   * fall back to the newest remaining session.
   */
  function resolveNextActiveSessionId(nextSessions: ChatSession[], deletedIds: string[]) {
    if (activeSessionId && !deletedIds.includes(activeSessionId)) {
      return activeSessionId;
    }

    return nextSessions[0]?.id || null;
  }

  /**
   * 在用户确认后删除单个会话，并同步更新当前激活会话以及右侧展示的消息列表。
   * Deletes a single session after user confirmation and updates the active
   * session and visible message list accordingly.
   */
  async function handleDeleteSession(sessionId: string) {
    const confirmed = window.confirm("Delete this chat session and all of its messages?");
    if (!confirmed) {
      return false;
    }

    try {
      await removeChatSession(sessionId);
      const nextSessions = sessions.filter((session) => session.id !== sessionId);
      const nextActiveSessionId = resolveNextActiveSessionId(nextSessions, [sessionId]);

      setSessions(nextSessions);
      setIsNewChatMode(!nextActiveSessionId);
      setActiveSessionId(nextActiveSessionId);
      if (!nextActiveSessionId) {
        setMessages([]);
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete chat session");
      return false;
    }
  }

  /**
   * 删除传入的会话集合，并重新计算下一个激活会话，避免右侧面板仍指向已删除会话。
   * Deletes the provided sessions and recomputes the next active
   * session so the right panel never points to a removed conversation.
   */
  async function handleDeleteSelectedSessions(sessionIds: string[]) {
    if (!sessionIds.length) {
      return false;
    }

    const confirmed = window.confirm(
      `Delete ${sessionIds.length} selected chat session(s) and all related messages?`,
    );
    if (!confirmed) {
      return false;
    }

    try {
      await removeChatSessions(sessionIds);
      const deletedIds = [...sessionIds];
      const nextSessions = sessions.filter((session) => !deletedIds.includes(session.id));
      const nextActiveSessionId = resolveNextActiveSessionId(nextSessions, deletedIds);

      setSessions(nextSessions);
      setIsNewChatMode(!nextActiveSessionId);
      setActiveSessionId(nextActiveSessionId);
      if (!nextActiveSessionId) {
        setMessages([]);
      }
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete chat sessions");
      return false;
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white">
      <main className="relative flex min-w-0 flex-1 flex-col bg-white">
        <ChatMessageList messages={messages} errorMessage={errorMessage} isLoading={isLoading} />

        <ChatComposer
          draft={draft}
          isLoading={isLoading}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
        />
      </main>

      <ChatHistoryDrawer
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onDeleteSelected={handleDeleteSelectedSessions}
      />
    </div>
  );
};

export default ChatPage;
