import { Router } from "express";
import multer from "multer";
import { uploadImage, uploadMultipleImages, deleteImage } from "../controllers/uploadController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Configure Multer for in-memory buffer handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WEBP, AVIF, GIF) are allowed"));
    }
  },
});

// Admin-Only Routes for uploading and deleting images
router.post("/", authenticate, requireAdmin, upload.single("image"), uploadImage);
router.post("/multiple", authenticate, requireAdmin, upload.array("images", 10), uploadMultipleImages);
router.delete("/", authenticate, requireAdmin, deleteImage);

export default router;
