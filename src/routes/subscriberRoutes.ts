import { Router } from "express";
import { subscribeEmail, getSubscribers, sendEmailToSubscribers, deleteSubscriber } from "../controllers/subscriberController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public: Subscribe email to newsletter
router.post("/", subscribeEmail);

// Admin Only: View, broadcast emails, and delete subscribers
router.get("/", authenticate, requireAdmin, getSubscribers);
router.post("/send-email", authenticate, requireAdmin, sendEmailToSubscribers);
router.delete("/:id", authenticate, requireAdmin, deleteSubscriber);

export default router;
