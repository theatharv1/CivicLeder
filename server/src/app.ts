import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/api.js";
import { publicAlertsRouter } from "./routes/publicAlerts.js";
import { ok } from "./utils/errors.js";

export function createApp() {
  const app = express();
  // nginx on the same host forwards the client IP (used by rate limits).
  app.set("trust proxy", "loopback");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin:
        config.corsOrigins === "*"
          ? true
          : config.corsOrigins.split(",").map((s) => s.trim()),
    })
  );
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/v1/health", (_req, res) => {
    res.json(ok({ status: "ok" }));
  });

  app.use("/api/v1/public-alerts", publicAlertsRouter);
  app.use("/api/v1", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
