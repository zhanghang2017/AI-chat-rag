import type { NextFunction, Request, Response } from "express";
import {
  chatCompletionBodySchema,
  createSessionBodySchema,
  deleteSessionsBodySchema,
  fingerprintSchema,
  messageBodySchema,
  messageListQuerySchema,
  sessionParamsSchema,
  sessionsQuerySchema,
} from "../common/schemas";
import { validate } from "../common/validation";
import * as aiService from "../services/ai.service";
import * as chatService from "../services/chat.service";

type StreamEventPayload = Record<string, unknown>;

function writeSseEvent(res: Response, event: string, data: StreamEventPayload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function parseSseEventBlock(block: string) {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

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
    data: JSON.parse(dataLines.join("\n")) as StreamEventPayload,
  };
}

/**
 * 为指纹用户创建新的会话。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入 201 成功响应或将错误传递给全局错误中间件。
 */
export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(createSessionBodySchema, req.body || {}, "request body");
    const session = await chatService.createChatSession({
      userId: payload.userId,
      title: payload.title,
    });
    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
}

/**
 * 查询指纹用户下的会话列表。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validate(sessionsQuerySchema, req.query || {}, "query params");
    const sessions = await chatService.getChatSessions({
      userId: query.userId,
      limit: query.limit,
    });
    res.json({ data: sessions });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除单个会话及其关联消息。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 */
export async function deleteSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = validate(sessionParamsSchema, req.params || {}, "path params");
    const payload = validate(
      fingerprintSchema,
      req.body && Object.keys(req.body).length ? req.body : req.query || {},
      "request body",
    );
    const result = await chatService.deleteChatSession({
      sessionId: id,
      userId: payload.userId,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 批量删除多个会话及其关联消息。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 */
export async function deleteSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const body = validate(deleteSessionsBodySchema, req.body || {}, "request body");
    const result = await chatService.deleteChatSessions(body);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 向指定会话追加一条消息。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入 201 成功响应或将错误传递给全局错误中间件。
 */
export async function createMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = validate(sessionParamsSchema, req.params || {}, "path params");
    const body = validate(messageBodySchema, req.body || {}, "request body");
    const message = await chatService.createChatMessage({
      sessionId: id,
      role: body.role,
      content: body.content,
    });

    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
}

/**
 * 查询会话内按时间排序的消息。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 * @returns 写入标准成功响应或将错误传递给全局错误中间件。
 */
export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = validate(sessionParamsSchema, req.params || {}, "path params");
    const { limit } = validate(messageListQuerySchema, req.query || {}, "query params");
    const messages = await chatService.getChatMessages({ sessionId: id, limit });
    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
}

/**
 * 为指定会话执行一次流式聊天完成。
 * @param req Express 请求对象。
 * @param res Express 响应对象。
 * @param next Express next 回调。
 */
export async function completeSessionChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = validate(sessionParamsSchema, req.params || {}, "path params");
    const body = validate(chatCompletionBodySchema, req.body || {}, "request body");

    await chatService.requireOwnedSession({
      sessionId: id,
      userId: body.userId,
    });

    const userMessage = await chatService.createChatMessage({
      sessionId: id,
      role: "user",
      content: body.content,
    });

    const recentMessages = await chatService.getRecentChatMessages({
      sessionId: id,
      limit: 8,
    });

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    writeSseEvent(res, "message.started", {
      sessionId: id,
      userMessage,
    });

    const upstream = await aiService.streamChat({
      query: body.content,
      sessionId: id,
      userId: body.userId,
      recentMessages: recentMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantContent = "";
    let assistantSources: Array<Record<string, unknown>> = [];
    let completed = false;
    let failed = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex >= 0) {
        const block = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        separatorIndex = buffer.indexOf("\n\n");

        const parsed = parseSseEventBlock(block);
        if (!parsed) {
          continue;
        }

        if (parsed.event === "message.delta") {
          const delta = typeof parsed.data.delta === "string" ? parsed.data.delta : "";
          assistantContent += delta;
          writeSseEvent(res, parsed.event, parsed.data);
          continue;
        }

        if (parsed.event === "message.started") {
          continue;
        }

        if (parsed.event === "message.sources") {
          assistantSources = Array.isArray(parsed.data.sources)
            ? (parsed.data.sources as Array<Record<string, unknown>>)
            : [];
          writeSseEvent(res, parsed.event, parsed.data);
          continue;
        }

        if (parsed.event === "message.completed") {
          completed = true;
          const assistantMessage = await chatService.createAssistantMessage({
            sessionId: id,
            content: assistantContent,
            sources: assistantSources,
          });
          writeSseEvent(res, parsed.event, {
            ...parsed.data,
            assistantMessage,
          });
          continue;
        }

        if (parsed.event === "message.failed") {
          failed = true;
          writeSseEvent(res, parsed.event, parsed.data);
          continue;
        }

        writeSseEvent(res, parsed.event, parsed.data);
      }
    }

    if (!completed && !failed) {
      writeSseEvent(res, "message.failed", {
        code: "STREAM_TERMINATED",
        message: "AI response ended unexpectedly",
      });
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    writeSseEvent(res, "message.failed", {
      code: (error as { code?: string })?.code || "CHAT_STREAM_ERROR",
      message: error instanceof Error ? error.message : "Chat stream failed",
    });
    res.end();
  }
}
