import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
} from "../controllers/paymentController.js";
import { authenticateOptional } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", authenticateOptional, createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", handleRazorpayWebhook);
router.get("/status/:orderId", getPaymentStatus);

export default router;

