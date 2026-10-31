import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderByIdOrNumber,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { authenticate, authenticateOptional, requireAdmin } from "../middleware/auth.js";

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

// Create order - requires authentication
router.post("/", authenticate, createOrder);

// Get user/admin orders (uses authenticateOptional so expired tokens don't crash admin portal)
router.get("/", authenticateOptional, getOrders);
router.get("/:identifier", getOrderByIdOrNumber);
router.put("/:id/status", adminAuth, updateOrderStatus);
router.delete("/:id", adminAuth, deleteOrder);

export default router;
