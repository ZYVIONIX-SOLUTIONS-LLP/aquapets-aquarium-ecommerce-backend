import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderByIdOrNumber,
  updateOrderStatus,
} from "../controllers/orderController.js";
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

// Create order (can be guest or authenticated user)
router.post("/", (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, createOrder);

// Get user/admin orders (or all orders in dev/guest mode)
router.get("/", (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, getOrders);
router.get("/:identifier", getOrderByIdOrNumber);
router.put("/:id/status", adminAuth, updateOrderStatus);

export default router;
