import multer from "multer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const maxFileSize = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 20) * 1024 * 1024;
const uploadTmpDir = path.resolve(process.cwd(), "upload", "tmp");

mkdirSync(uploadTmpDir, { recursive: true });

// Disk storage avoids buffering large files in memory.
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadTmpDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "") || ".bin";
      const tempName = `${Date.now()}_${crypto.randomUUID()}${ext}`;
      cb(null, tempName);
    },
  }),
  limits: {
    fileSize: maxFileSize,
  },
});
