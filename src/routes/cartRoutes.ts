import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getCart, syncCart, updateCart, clearCart } from "../controllers/cartController.js";

const router = Router();

router.use(authenticate);

router.get("/", getCart);
router.post("/sync", syncCart);
router.put("/", updateCart);
router.delete("/", clearCart);

export default router;
