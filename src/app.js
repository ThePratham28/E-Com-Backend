import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import apiRouterV1 from "./api/routes/v1/index.js";
import connectToDB, { closeDB } from "./configs/connect-to-db.js";
import config, { isDev } from "./configs/config.js";
import mongoose from "mongoose";

const app = express();
app.disable("x-powered-by"); 

// Observability & security middlewares
app.use(pinoHttp());
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins.length ? config.allowedOrigins : false,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "100kb" }));

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
    console.log(`Server listening on port ${config.PORT} [${config.NODE_ENV}]`);
  } catch (e) {
    console.error("DB connection failed at startup", e?.message || e);
  }
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    try {
      await closeDB();
      process.exit(0);
    } catch (e) {
      console.error("Error during shutdown", e?.message || e);
      process.exit(1);
    }
  });
};

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

export default app;
