import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { sendApiError } from "../common/errors";
import { aiChatBodySchema } from "../common/schemas";
import { validate } from "../common/validation";
import * as fileController from "../controllers/file.controller";
import * as aiService from "../services/ai.service";

const aiRouter = Router();
const aiServiceSharedSecret = process.env.AI_SERVICE_SHARED_SECRET || "";

function requireAiServiceSecret(req: Request, res: Response, next: NextFunction) {
  if (!aiServiceSharedSecret) {
    next();
    return;
  }

  const provided = req.header("x-ai-service-secret") || "";
  if (provided !== aiServiceSharedSecret) {
    sendApiError(res, 401, "UNAUTHORIZED_AI_CALLBACK", "Invalid AI service secret");
    return;
  }

  next();
}

aiRouter.post("/chat", async (req, res, next) => {
  try {
    // Keep AI payload validation at route boundary for predictable proxy behavior.
    const payload = validate(aiChatBodySchema, req.body || {}, "request body");
    const result = await aiService.requestChat({
      query: payload.query,
      sessionId: payload.sessionId,
      userId: payload.userId,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/ingestion/callback", requireAiServiceSecret, fileController.ingestionCallback);
aiRouter.post("/ingestion/chunks", requireAiServiceSecret, fileController.syncIngestionChunks);

export default aiRouter;
