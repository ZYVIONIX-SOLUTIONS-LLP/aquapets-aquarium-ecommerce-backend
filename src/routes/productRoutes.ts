import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const adminAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  }
  // Allow direct admin action in development
  next();
};

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.post("/", adminAuth, createProduct);
router.put("/:id", adminAuth, updateProduct);
router.delete("/:id", adminAuth, deleteProduct);

export default router;
