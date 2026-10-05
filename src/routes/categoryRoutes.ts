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

const adminAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  }
  next();
};

router.get("/", getCategories);
router.post("/sync", syncAllCategories);
router.get("/:slug", getCategoryBySlug);
router.post("/", adminAuth, createCategory);
router.put("/:id", adminAuth, updateCategory);
router.delete("/:id", adminAuth, deleteCategory);

export default router;
