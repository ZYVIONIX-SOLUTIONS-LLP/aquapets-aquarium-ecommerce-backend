import { Router } from "express";
import { subscribeEmail, getSubscribers, sendEmailToSubscribers, deleteSubscriber } from "../controllers/subscriberController.js";

const router = Router();

router.post("/", subscribeEmail);
router.get("/", getSubscribers);
router.post("/send-email", sendEmailToSubscribers);
router.delete("/:id", deleteSubscriber);

export default router;
