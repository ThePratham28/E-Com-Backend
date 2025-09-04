import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().optional().default("3000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  ALLOWED_ORIGINS: z.string().optional(), // comma-separated
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

const config = Object.freeze({
  NODE_ENV: env.NODE_ENV,
  PORT: Number(env.PORT || 3000),
  MONGO_URI: env.MONGO_URI,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
  allowedOrigins: env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [],
});

export const isDev = config.NODE_ENV === "development";
export const isProd = config.NODE_ENV === "production";
export default config;
