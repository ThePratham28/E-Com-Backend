import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.string().optional().default("3000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  ALLOWED_ORIGINS: z.string().optional(), // comma-separated
  // JWT and Cookies
  ACCESS_TOKEN_PRIVATE_KEY: z.string().optional(),
  ACCESS_TOKEN_PUBLIC_KEY: z.string().optional(),
  REFRESH_TOKEN_PRIVATE_KEY: z.string().optional(),
  REFRESH_TOKEN_PUBLIC_KEY: z.string().optional(),
  ACCESS_TOKEN_TTL: z.string().optional().default("10m"),
  REFRESH_TOKEN_TTL: z.string().optional().default("30d"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().optional(), // "true" or "false"
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
  jwt: {
    access: {
      privateKey: env.ACCESS_TOKEN_PRIVATE_KEY,
      publicKey: env.ACCESS_TOKEN_PUBLIC_KEY,
      ttl: env.ACCESS_TOKEN_TTL || "10m",
    },
    refresh: {
      privateKey: env.REFRESH_TOKEN_PRIVATE_KEY,
      publicKey: env.REFRESH_TOKEN_PUBLIC_KEY,
      ttl: env.REFRESH_TOKEN_TTL || "30d",
    },
  },
  cookies: {
    domain: env.COOKIE_DOMAIN || undefined,
    secure: String(env.COOKIE_SECURE || "false").toLowerCase() === "true",
  },
});

export const isDev = config.NODE_ENV === "development";
export const isProd = config.NODE_ENV === "production";
export default config;
