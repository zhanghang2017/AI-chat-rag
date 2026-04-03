import { Router } from "express";
import * as chatController from "../controllers/chat.controller";
import * as fileController from "../controllers/file.controller";
import { requireFingerprint } from "../middleware/fingerprint";
import { upload } from "../middleware/upload";
import aiRouter from "./ai.routes";

const router = Router();

// Optional bootstrap endpoint; business endpoints can upsert user as needed.
router.post("/users/identify", fileController.identifyUser);

// Upload route requires multipart field `file` and fingerprint payload.
router.post("/files/precheck", requireFingerprint, fileController.precheckFileUpload);
router.post("/files/upload", upload.single("file"), requireFingerprint, fileController.uploadFile);
router.post("/files/upload/chunked/init", fileController.initChunkUpload);
router.post("/files/upload/chunked/chunk", upload.single("file"), fileController.uploadChunk);
router.get("/files/upload/chunked/status", fileController.getChunkUploadStatus);
router.post("/files/upload/chunked/complete", fileController.completeChunkUpload);
router.get("/files", requireFingerprint, fileController.getFiles);
router.get("/files/:fileId/detail", requireFingerprint, fileController.getFileDetail);
router.post("/files/:fileId/ingest", requireFingerprint, fileController.dispatchPendingFileIngestion);
router.post("/files/:fileId/offload", requireFingerprint, fileController.offloadIndexedFile);
router.delete("/files/:fileId", requireFingerprint, fileController.deleteKnowledgeFile);
router.get("/files/events", requireFingerprint, fileController.streamFileEvents);
router.get("/tasks/:taskId", fileController.getTask);

// Chat routes map session and message operations.
router.post("/chat/sessions", requireFingerprint, chatController.createSession);
router.get("/chat/sessions", requireFingerprint, chatController.getSessions);
router.delete("/chat/sessions", requireFingerprint, chatController.deleteSessions);
router.post("/chat/sessions/:id/messages", chatController.createMessage);
router.get("/chat/sessions/:id/messages", chatController.getMessages);
router.delete("/chat/sessions/:id", requireFingerprint, chatController.deleteSession);
router.post("/chat/sessions/:id/completions", requireFingerprint, chatController.completeSessionChat);

// AI proxy routes are isolated for future Python service evolution.
router.use("/ai", aiRouter);

export default router;
