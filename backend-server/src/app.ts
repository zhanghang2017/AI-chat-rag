import cors from "cors";
import express from "express";
import { errorHandler } from "./common/errors";
import routes from "./routes/index";

export const app = express();

// Cross-origin access is enabled for MVP frontend integration.
app.use(cors());
// Parse JSON request bodies for all API handlers.
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// All business APIs are served under /v1.
app.use("/v1", routes);

// Keep error middleware last so thrown errors are normalized.
app.use(errorHandler);
