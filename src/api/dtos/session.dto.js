import { z } from "zod";

export const listSessionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
});

export const revokeBody = z
  .object({
    jti: z.string().trim().optional(),
    deviceId: z.string().trim().optional(),
    all: z.boolean().optional().default(false),
  })
  .refine((v) => v.all || v.jti || v.deviceId, {
    message: "Provide either all=true or jti or deviceId",
    path: ["all"],
  });

export const revokeParams = z.object({ jti: z.string().trim() });

export default { listSessionsQuery, revokeBody, revokeParams };
