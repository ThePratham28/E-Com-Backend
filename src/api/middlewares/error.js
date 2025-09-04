import config from "../../configs/config.js";

export function notFoundHandler(req, res, next) {
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
  res.status(status).json(body);
}
