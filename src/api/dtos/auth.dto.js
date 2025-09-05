import { z } from "zod";

export const registerDto = z.object({
  username: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  deviceId: z.string().trim().min(1).optional(),
});

export const refreshDto = z.object({
  deviceId: z.string().trim().min(1).optional(),
});

export const logoutDto = z.object({
  deviceId: z.string().trim().min(1).optional(),
  allDevices: z.boolean().optional().default(false),
});

export default { registerDto, loginDto, refreshDto, logoutDto };
