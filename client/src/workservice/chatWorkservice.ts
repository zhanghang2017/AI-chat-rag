import {
  createChatSession,
  deleteChatSession,
  deleteChatSessions,
  getChatMessages,
  getChatSessions,
  streamChatCompletion,
  type ChatCompletionEvent,
} from "../api";
import { getOrCreateUserId } from "./uploadWorkservice";

export async function loadChatSessions() {
  return getChatSessions(getOrCreateUserId());
}

export async function loadSessionMessages(sessionId: string) {
  return getChatMessages(sessionId);
}

export async function createChatSessionFromUserMessage(content: string) {
  return createChatSession(getOrCreateUserId(), content.slice(0, 200));
}

export async function sendChatMessage(
  sessionId: string,
  content: string,
  onEvent: (event: ChatCompletionEvent) => void,
) {
  return streamChatCompletion(sessionId, getOrCreateUserId(), content, onEvent);
}

export async function removeChatSession(sessionId: string) {
  return deleteChatSession(sessionId, getOrCreateUserId());
}

export async function removeChatSessions(sessionIds: string[]) {
  return deleteChatSessions(sessionIds, getOrCreateUserId());
}
