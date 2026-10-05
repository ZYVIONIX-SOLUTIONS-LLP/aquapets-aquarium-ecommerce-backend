import { Router } from "express";
import { getGuides, getGuideBySlug, createGuide } from "../controllers/guideController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getGuides);
router.get("/:slug", getGuideBySlug);
router.post("/", authenticate, requireAdmin, createGuide);

export default router;
