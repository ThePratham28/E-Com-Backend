import { Category } from "../../models/index.js";
import logger from "../../utils/logger.js";

/**
 * Create a new category
 */
export async function createCategory({ name, description, parentCategory = null }) {
  const categoryData = {
    name: name.trim(),
    description: description?.trim(),
    parentCategory: parentCategory || null,
  };

  const category = await Category.create(categoryData);
  logger.info({ categoryId: category.id, name }, "Category created");
  return category.toJSON();
}

/**
 * Get category by ID
 */
export async function getCategoryById(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }
  return category.toJSON();
}

/**
 * Update category
 */
export async function updateCategory(id, { name, description, parentCategory }) {
  const updateData = {};
  
  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim();
  if (parentCategory !== undefined) updateData.parentCategory = parentCategory;

  const category = await Category.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  logger.info({ categoryId: category.id }, "Category updated");
  return category.toJSON();
}

/**
 * Delete category
 */
export async function deleteCategory(id) {
  const category = await Category.findByIdAndDelete(id);
  
  if (!category) {
    throw new Error("Category not found");
  }

  logger.info({ categoryId: category.id, name: category.name }, "Category deleted");
  return { success: true, deletedCategory: category.toJSON() };
}

/**
 * List categories with hierarchical support
 */
export async function listCategories({ parent = null, limit = 20, cursor = null }) {
  const filter = {};
  
  if (parent === "null" || parent === null) {
    filter.parentCategory = null;
  } else if (parent) {
    filter.parentCategory = parent;
  }

  if (cursor) {
    filter._id = { $lt: cursor };
  }

  const categories = await Category.find(filter)
    .sort({ _id: -1 })
    .limit(Number(limit))
    .lean();

  const nextCursor = categories.length ? categories[categories.length - 1]._id : null;
  
  logger.info({ count: categories.length, parent }, "Categories listed");
  return { items: categories, nextCursor };
}

/**
 * Get category hierarchy (tree structure)
 */
export async function getCategoryHierarchy() {
  const categories = await Category.find().lean();
  
  // Build hierarchy
  const categoryMap = new Map();
  const rootCategories = [];
  
  // First pass: create map and find root categories
  categories.forEach(category => {
    categoryMap.set(category._id.toString(), {
      ...category,
      children: []
    });
    
    if (!category.parentCategory) {
      rootCategories.push(categoryMap.get(category._id.toString()));
    }
  });
  
  // Second pass: build hierarchy
  categories.forEach(category => {
    if (category.parentCategory) {
      const parent = categoryMap.get(category.parentCategory.toString());
      if (parent) {
        parent.children.push(categoryMap.get(category._id.toString()));
      }
    }
  });
  
  return rootCategories;
}

/**
 * Validate category can be deleted (no products in root categories)
 */
export async function validateCategoryDeletion(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }
  
  // For root categories, check if they have products
  if (!category.parentCategory) {
    const Product = (await import("../../models/index.js")).Product;
    const productCount = await Product.countDocuments({ category: id });
    
    if (productCount > 0) {
      throw new Error(
        "Cannot delete a root category that still has products. Move or reassign products first."
      );
    }
  }
  
  return { canDelete: true };
}

export default {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  listCategories,
  getCategoryHierarchy,
  validateCategoryDeletion,
};
