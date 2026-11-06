import { Router } from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  syncAllCategories,
} from "../controllers/categoryController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getCategories);
router.post("/sync", authenticate, requireAdmin, syncAllCategories);
router.get("/:slug", getCategoryBySlug);
router.post("/", authenticate, requireAdmin, createCategory);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

export default router;
