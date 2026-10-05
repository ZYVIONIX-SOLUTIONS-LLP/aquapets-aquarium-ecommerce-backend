import { Router } from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import orderRoutes from "./orderRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import shippingRoutes from "./shippingRoutes.js";
import guideRoutes from "./guideRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import subscriberRoutes from "./subscriberRoutes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Aqua Pets Aquarium API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      categories: "/api/categories",
      orders: "/api/orders",
      auth: "/api/auth",
      shipping: "/api/shipping",
      guides: "/api/guides",
      upload: "/api/upload",
      wishlist: "/api/wishlist",
      subscribers: "/api/subscribers",
    },
  });
});

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Aqua Pets Aquarium API",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/payment", paymentRoutes);
router.use("/payments", paymentRoutes);
router.use("/shipping", shippingRoutes);
router.use("/guides", guideRoutes);
router.use("/upload", uploadRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/subscribers", subscriberRoutes);

export default router;
