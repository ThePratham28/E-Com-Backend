import { z } from "zod";

export const createProductDto = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  price: z.number().nonnegative(),
  sku: z.string().trim().min(1).max(64),
  stockQuantity: z.number().int().nonnegative().default(0),
  category: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

export const updateProductDto = createProductDto.partial();

export default { createProductDto, updateProductDto };
