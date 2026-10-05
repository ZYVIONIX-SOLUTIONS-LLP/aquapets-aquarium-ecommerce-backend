import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: "fubaby5m",
  api_key: "273799561385971",
  api_secret: "e_i6MBjSD4zINt1AzL6qB7MoePk",
  secure: true,
});

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aqua_pets_aquarium";
const CATEGORIES_DIR = path.resolve(__dirname, "../../aqua-pets-frontend/public/categories");

const categorySchema = new mongoose.Schema({
  slug: String,
  name: String,
  description: String,
  image: String,
  productCount: Number,
  iconName: String,
  sortOrder: Number,
});

const CategoryModel = mongoose.model("Category", categorySchema);

async function uploadCategoryImages() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  const files = fs.readdirSync(CATEGORIES_DIR);
  console.log(`Found ${files.length} category image files in ${CATEGORIES_DIR}`);

  const categories = await CategoryModel.find();
  console.log(`Found ${categories.length} categories in database.`);

  for (const cat of categories) {
    // Find matching file by slug
    const matchingFile = files.find(
      (f) => path.parse(f).name.toLowerCase() === cat.slug.toLowerCase()
    );

    if (matchingFile) {
      const filePath = path.join(CATEGORIES_DIR, matchingFile);
      console.log(`Uploading ${matchingFile} for category "${cat.name}" (${cat.slug})...`);

      try {
        const uploadRes = await cloudinary.uploader.upload(filePath, {
          folder: "aqua-pets/categories",
          public_id: cat.slug,
          overwrite: true,
          transformation: [
            { quality: "auto", fetch_format: "auto" }
          ],
        });

        console.log(` -> Cloudinary URL: ${uploadRes.secure_url}`);
        cat.image = uploadRes.secure_url;
        await cat.save();
        console.log(` -> Updated MongoDB category "${cat.name}"`);
      } catch (err) {
        console.error(`Error uploading ${matchingFile}:`, err);
      }
    } else {
      console.warn(`No local file found for category slug "${cat.slug}"`);
    }
  }

  console.log("\n✅ All Category Images Uploaded to Cloudinary and Synced with MongoDB!");
  await mongoose.disconnect();
}

uploadCategoryImages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
