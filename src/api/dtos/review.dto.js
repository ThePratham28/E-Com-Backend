import { z } from "zod";

export const createReviewDto = z.object({
  product: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional().default(""),
});

export const updateReviewDto = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(5000).optional(),
});

export default { createReviewDto, updateReviewDto };
