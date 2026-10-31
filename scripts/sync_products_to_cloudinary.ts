import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Ensure DNS works for MongoDB Atlas on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore fallback
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "xsxvzuhd",
  api_key: process.env.CLOUDINARY_API_KEY || "523591489351473",
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || "",
  secure: true,
});

const MONGO_URI =
  process.env.MONGODB_URI ||
  "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

const FRONTEND_PUBLIC_DIR = path.resolve(__dirname, "../../aqua-pets-frontend/public");

const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    images: [String],
    category: String,
  },
  { strict: false }
);

const ProductModel = mongoose.model("Product", productSchema);

async function syncProductsToCloudinary() {
  console.log("🌊 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB!");

  const products = await ProductModel.find({});
  console.log(`📦 Found ${products.length} products in database.`);

  let updatedCount = 0;

  for (const product of products) {
    if (!product.images || product.images.length === 0) continue;

    let hasChanges = false;
    const newImages: string[] = [];

    for (const imgUrl of product.images) {
      // If it's already a Cloudinary URL on the new cloud, keep it
      if (typeof imgUrl === "string" && imgUrl.includes("res.cloudinary.com/xsxvzuhd")) {
        newImages.push(imgUrl);
        continue;
      }

      // If it's a local path like /products/tanks/filename.jpg
      const cleanRelPath = imgUrl.startsWith("/") ? imgUrl.substring(1) : imgUrl;
      const localFilePath = path.resolve(FRONTEND_PUBLIC_DIR, cleanRelPath);

      if (fs.existsSync(localFilePath)) {
        console.log(`\n⬆️ Uploading to Cloudinary for product "${product.name}":`);
        console.log(`   Local File: ${cleanRelPath}`);

        try {
          const fileNameWithoutExt = path.parse(localFilePath).name;
          const uploadRes = await cloudinary.uploader.upload(localFilePath, {
            folder: "aqua-pets/products",
            public_id: fileNameWithoutExt,
            overwrite: true,
            resource_type: "image",
            transformation: [{ quality: "auto", fetch_format: "auto" }],
          });

          console.log(`   ☁️ Cloudinary URL: ${uploadRes.secure_url}`);
          newImages.push(uploadRes.secure_url);
          hasChanges = true;
        } catch (uploadErr) {
          console.error(`   ❌ Failed to upload ${localFilePath}:`, uploadErr);
          newImages.push(imgUrl); // Keep fallback
        }
      } else {
        console.warn(`   ⚠️ Local file not found: ${localFilePath}`);
        newImages.push(imgUrl);
      }
    }

    if (hasChanges) {
      product.images = newImages;
      await product.save();
      updatedCount++;
      console.log(`   💾 Product "${product.name}" updated in MongoDB.`);
    }
  }

  console.log(`\n✨ Migration complete! Updated ${updatedCount} products to use Cloudinary CDN.`);
  await mongoose.disconnect();
}

syncProductsToCloudinary().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
