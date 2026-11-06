import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderByIdOrNumber,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { handleShiprocketWebhook, verifyWebhookEndpoint } from "../controllers/shippingController.js";
import { authenticate, authenticateOptional, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Webhook endpoint (supports both GET verification and POST updates)
router.get("/webhook", verifyWebhookEndpoint);
router.post("/webhook", handleShiprocketWebhook);

// Create order - requires authentication
router.post("/", authenticate, createOrder);

// Get user/admin orders (uses authenticateOptional so expired tokens don't crash admin portal)
router.get("/", authenticateOptional, getOrders);
router.get("/:identifier", getOrderByIdOrNumber);
router.put("/:id/status", authenticate, requireAdmin, updateOrderStatus);
router.delete("/:id", authenticate, requireAdmin, deleteOrder);

export default router;
