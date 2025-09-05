import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import apiRouterV1 from "./api/routes/v1/index.js";
import connectToDB, { closeDB } from "./configs/connect-to-db.js";
import config from "./configs/config.js";
import mongoose from "mongoose";
import logger from "./utils/logger.js";

const app = express();
app.disable("x-powered-by");

// Observability & security middlewares
app.use(
  pinoHttp({
    logger,
    customLogLevel: function (res, err) {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    autoLogging: { ignorePaths: ["/api/health", "/api/ready"] },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.ip,
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins.length ? config.allowedOrigins : false,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health and readiness endpoints
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/ready", (req, res) => {
  const state = mongoose.connection.readyState; // 1 connected, 2 connecting
  res.json({ dbConnected: state === 1 });
});

// Versioned APIs
app.use("/api/v1", apiRouterV1);

// 404 and error handlers
import { notFoundHandler, errorHandler } from "./api/middlewares/error.js";
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.PORT, async () => {
  try {
    await connectToDB();
    logger.info(`Server listening on port ${config.PORT} [${config.NODE_ENV}]`);
  } catch (e) {
    logger.error({ err: e }, "DB connection failed at startup");
  }
});

const shutdown = async (signal) => {
  logger.warn(`${signal} received. Shutting down...`);
  server.close(async () => {
    try {
      await closeDB();
      logger.info("Shutdown completed");
      process.exit(0);
    } catch (e) {
      logger.error({ err: e }, "Error during shutdown");
      process.exit(1);
    }
  });
};

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

export default app;
