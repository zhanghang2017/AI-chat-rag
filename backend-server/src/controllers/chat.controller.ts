import type { NextFunction, Request, Response } from "express";
import {
  createSessionBodySchema,
  messageBodySchema,
  messageListQuerySchema,
  sessionParamsSchema,
  sessionsQuerySchema,
} from "../common/schemas";
import { validate } from "../common/validation";
import * as chatService from "../services/chat.service";

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
