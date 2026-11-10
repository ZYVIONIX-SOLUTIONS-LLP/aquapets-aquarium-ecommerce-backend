import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  applyBulkOffer,
  resetBulkOffers,
  getOffersSummary,
} from "../controllers/productController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getProducts);
router.get("/offers-summary", authenticate, requireAdmin, getOffersSummary);
router.post("/bulk-offer", authenticate, requireAdmin, applyBulkOffer);
router.post("/reset-offers", authenticate, requireAdmin, resetBulkOffers);
router.get("/:slug", getProductBySlug);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

export default router;
