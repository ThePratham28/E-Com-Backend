import { z } from "zod";

// Create category DTO
export const createCategoryDto = z.object({
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(2000).trim().optional(),
  parentCategory: z.string().nullable().optional(),
});

// Update category DTO
export const updateCategoryDto = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  parentCategory: z.string().nullable().optional(),
});

// Category ID param DTO
export const categoryIdParam = z.object({
  id: z.string().min(1),
});

// Query parameters for listing categories
export const listCategoriesQuery = z.object({
  parent: z.string().nullable().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export default {
  createCategoryDto,
  updateCategoryDto,
  categoryIdParam,
  listCategoriesQuery,
};
