import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
  cancelPendingOrder,
  reconcilePaymentOrder,
  reconcileAllAbandonedOrders,
} from "../controllers/paymentController.js";
import { authenticate, authenticateOptional, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", handleRazorpayWebhook);
router.get("/status/:orderId", authenticateOptional, getPaymentStatus);
router.post("/cancel-pending", authenticate, cancelPendingOrder);
router.post("/reconcile/:orderId", authenticateOptional, reconcilePaymentOrder);
router.post("/reconcile-all", authenticate, requireAdmin, reconcileAllAbandonedOrders);

export default router;

