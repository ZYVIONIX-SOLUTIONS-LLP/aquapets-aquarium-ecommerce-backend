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

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

export default router;
