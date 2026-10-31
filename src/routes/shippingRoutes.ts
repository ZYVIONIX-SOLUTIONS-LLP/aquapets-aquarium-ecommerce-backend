import { Router } from "express";
import {
  checkServiceability,
  createShipmentOrder,
  generateAWB,
  requestPickup,
  generateLabel,
  trackShipment,
  handleShiprocketWebhook,
  verifyWebhookEndpoint,
} from "../controllers/shippingController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// 1. Serviceability Check
router.post("/serviceability", checkServiceability);

// 2. Shipment lifecycle (supports both /order/:id/... and /orders/:id/...)
router.post("/orders/:orderId/create-shipment", authenticate, requireAdmin, createShipmentOrder);
router.post("/order/:orderId/create", authenticate, requireAdmin, createShipmentOrder);
router.post("/orders/:orderId/create", authenticate, requireAdmin, createShipmentOrder);

router.post("/orders/:orderId/generate-awb", authenticate, requireAdmin, generateAWB);
router.post("/order/:orderId/awb", authenticate, requireAdmin, generateAWB);
router.post("/orders/:orderId/awb", authenticate, requireAdmin, generateAWB);

router.post("/orders/:orderId/request-pickup", authenticate, requireAdmin, requestPickup);
router.post("/order/:orderId/pickup", authenticate, requireAdmin, requestPickup);

router.get("/orders/:orderId/label", authenticate, requireAdmin, generateLabel);
router.get("/order/:orderId/label", authenticate, requireAdmin, generateLabel);

// 3. Real-time Tracking (AWB code or Order ID)
router.get("/track/:awbOrOrderId", trackShipment);

// 4. Webhook from Shiprocket (Live status & tracking events)
router.get("/webhook", verifyWebhookEndpoint);
router.post("/webhook", handleShiprocketWebhook);
router.post("/webhook/test", handleShiprocketWebhook);

export default router;
