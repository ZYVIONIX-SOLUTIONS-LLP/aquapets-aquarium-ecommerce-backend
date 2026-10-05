import { Router } from "express";
import {
  checkServiceability,
  createShipmentOrder,
  generateAWB,
  requestPickup,
  trackShipment,
  handleShiprocketWebhook,
} from "../controllers/shippingController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// 1. Serviceability Check
router.post("/serviceability", checkServiceability);

// 2. Shipment lifecycle
router.post("/orders/:orderId/create-shipment", authenticate, requireAdmin, createShipmentOrder);
router.post("/orders/:orderId/generate-awb", authenticate, requireAdmin, generateAWB);
router.post("/orders/:orderId/request-pickup", authenticate, requireAdmin, requestPickup);

// 3. Real-time Tracking (AWB code or Order ID)
router.get("/track/:awbOrOrderId", trackShipment);

// 4. Webhook from Shiprocket
router.post("/webhook", handleShiprocketWebhook);

export default router;
