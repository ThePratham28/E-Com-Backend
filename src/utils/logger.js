import pino from "pino";
import config from "../configs/config.js";

const isProd = config.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  base: { app: "e-com-backend", env: config.NODE_ENV },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "refreshToken",
      "accessToken",
      "token",
    ],
    remove: true,
  },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: false,
          ignore: "pid,hostname",
          messageFormat: "{msg}",
        },
      },
});

export default logger;
