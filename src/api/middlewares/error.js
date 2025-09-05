import config from "../../configs/config.js";
import logger from "../../utils/logger.js";

export function notFoundHandler(req, res, next) {
  logger.warn({ path: req.originalUrl, method: req.method }, "Not Found");
  res.status(404).json({ message: "Not Found", path: req.originalUrl });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const body = {
    message: err.message || "Internal Server Error",
  };
  if (config.NODE_ENV !== "production") {
    body.stack = err.stack;
  }
  // Log server errors only (avoid noisy 4xx unless explicitly provided)
  if (status >= 500) {
    logger.error(
      { err, path: req.originalUrl, method: req.method },
      "Unhandled error"
    );
  }
  res.status(status).json(body);
}
