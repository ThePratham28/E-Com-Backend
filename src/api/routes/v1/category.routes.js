import { Router } from "express";
import validate from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/auth.js";
import * as CategoryService from "../../services/category.service.js";
import {
  createCategoryDto,
  updateCategoryDto,
  categoryIdParam,
  listCategoriesQuery,
} from "../../dtos/category.dto.js";

const router = Router();

// Create category (admin only)
router.post(
  "/",
  requireAuth,
  validate({ body: createCategoryDto }),
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const category = await CategoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (e) {
      next(e);
    }
  }
);

// Get category by ID
router.get(
  "/:id",
  validate({ params: categoryIdParam }),
  async (req, res, next) => {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (e) {
      next(e);
    }
  }
);

// Update category (admin only)
router.put(
  "/:id",
  requireAuth,
  validate({ params: categoryIdParam, body: updateCategoryDto }),
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const category = await CategoryService.updateCategory(
        req.params.id,
        req.body
      );
      res.json(category);
    } catch (e) {
      next(e);
    }
  }
);

// Delete category (admin only)
router.delete(
  "/:id",
  requireAuth,
  validate({ params: categoryIdParam }),
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const result = await CategoryService.deleteCategory(req.params.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

// List categories
router.get(
  "/",
  validate({ query: listCategoriesQuery }),
  async (req, res, next) => {
    try {
      const { parent, limit, cursor } = req.query;
      const result = await CategoryService.listCategories({
        parent,
        limit,
        cursor,
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

// Get category hierarchy (tree structure)
router.get("/hierarchy/tree", async (req, res, next) => {
  try {
    const hierarchy = await CategoryService.getCategoryHierarchy();
    res.json(hierarchy);
  } catch (e) {
    next(e);
  }
});

// Validate if category can be deleted (admin only)
router.get(
  "/:id/can-delete",
  requireAuth,
  validate({ params: categoryIdParam }),
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const result = await CategoryService.validateCategoryDeletion(req.params.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
