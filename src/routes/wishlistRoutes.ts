import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getWishlist, toggleWishlist, syncWishlist } from "../controllers/wishlistController.js";

const router = Router();

router.use(authenticate);

router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);
router.post("/sync", syncWishlist);

export default router;
