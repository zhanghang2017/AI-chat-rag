/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-04-02 18:16:49
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-03 15:20:58
 */
import { createApiUrl, requestApi } from "./httpClient";

export type ChatMessageSource = {
  fileId?: string;
  fileName?: string;
  pageNumber?: number | null;
  chunkIndex?: number | null;
  snippet?: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: ChatMessageSource[];
};

export type ChatSession = {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: string;
  messageCount: number;
};

export type ChatCompletionEvent =
  | { type: "message.started"; userMessage?: ChatMessage }
  | { type: "message.delta"; delta: string }
  | { type: "message.sources"; sources: ChatMessageSource[] }
  | { type: "message.completed"; assistantMessage: ChatMessage }
  | { type: "message.failed"; code?: string; message?: string };

function parseSseBlock(block: string) {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return {
    event,
    data: JSON.parse(dataLines.join("\n")) as Record<string, unknown>,
  };
}

export async function createChatSession(userId: string, title?: string) {
  return requestApi<ChatSession>("/chat/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, title }),
  });
}

export async function getChatSessions(userId: string, limit = 50) {
  const query = new URLSearchParams({ userId, limit: String(limit) });
  return requestApi<ChatSession[]>(`/chat/sessions?${query.toString()}`);
}

export async function getChatMessages(sessionId: string, limit = 100) {
  const query = new URLSearchParams({ limit: String(limit) });
  return requestApi<ChatMessage[]>(`/chat/sessions/${sessionId}/messages?${query.toString()}`);
}

export async function deleteChatSession(sessionId: string, userId: string) {
  return requestApi<{ id: string }>(`/chat/sessions/${sessionId}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export async function deleteChatSessions(sessionIds: string[], userId: string) {
  return requestApi<{ deletedCount: number }>("/chat/sessions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, sessionIds }),
  });
}

export async function streamChatCompletion(
  sessionId: string,
  userId: string,
  content: string,
  onEvent: (event: ChatCompletionEvent) => void,
) {
  const response = await fetch(createApiUrl(`/chat/sessions/${sessionId}/completions`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ userId, content }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\n\n/);

    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (!parsed) {
        continue;
      }

      if (parsed.event === "message.started") {
        onEvent({ type: "message.started", userMessage: parsed.data.userMessage as ChatMessage | undefined });
        continue;
      }

      if (parsed.event === "message.delta") {
        onEvent({ type: "message.delta", delta: String(parsed.data.delta || "") });
        continue;
      }

      if (parsed.event === "message.sources") {
        onEvent({
          type: "message.sources",
          sources: (parsed.data.sources as ChatMessageSource[] | undefined) || [],
        });
        continue;
      }

      if (parsed.event === "message.completed") {
        onEvent({ type: "message.completed", assistantMessage: parsed.data.assistantMessage as ChatMessage });
        continue;
      }

      if (parsed.event === "message.failed") {
        onEvent({
          type: "message.failed",
          code: typeof parsed.data.code === "string" ? parsed.data.code : undefined,
          message: typeof parsed.data.message === "string" ? parsed.data.message : undefined,
        });
      }
    }
  }
}