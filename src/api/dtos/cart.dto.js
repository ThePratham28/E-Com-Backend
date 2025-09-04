import { z } from "zod";

export const addToCartDto = z.object({
  product: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});

export const updateCartItemDto = z.object({
  quantity: z.number().int().min(1),
});

export const removeCartItemDto = z.object({
  product: z.string().min(1),
});

export default { addToCartDto, updateCartItemDto, removeCartItemDto };
