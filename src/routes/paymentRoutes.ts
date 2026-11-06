import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
  cancelPendingOrder,
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", handleRazorpayWebhook);
router.get("/status/:orderId", getPaymentStatus);
router.post("/cancel-pending", authenticate, cancelPendingOrder);

export default router;

