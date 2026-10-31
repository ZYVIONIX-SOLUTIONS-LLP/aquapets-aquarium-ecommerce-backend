import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

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
  timeout: 120000,
});

const MONGO_URI =
  process.env.MONGODB_URI ||
  "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

const LOCAL_IMAGE_PATH = "C:/Users/akshi/.gemini/antigravity/brain/df74822e-b172-472e-8660-44f26d2480e3/.user_uploaded/media_1793205755807_e4e8beb0.jpg";

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: String,
    brand: String,
    category: String,
    description: String,
    fullDescription: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    reviewCount: Number,
    images: [String],
    stock: Number,
    badge: String,
    specifications: [{ label: String, value: String }],
    tags: [String],
    isFeatured: Boolean,
    isStarterKit: Boolean,
    isOffer: Boolean,
    weightKg: Number,
  },
  { timestamps: true }
);

const ProductModel = mongoose.model("Product", productSchema);
const CategoryModel = mongoose.model(
  "Category",
  new mongoose.Schema({ slug: String, productCount: Number }, { strict: false })
);

async function main() {
  console.log("🌊 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB Atlas!");

  const localImagePath = LOCAL_IMAGE_PATH;
  const publicId = "sunsun-jp-013f-submersible-filter-pump-main";

  let imageUrl = "";

  if (fs.existsSync(localImagePath)) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`⬆️ [Attempt ${attempt}] Uploading ${localImagePath} to Cloudinary...`);
        const uploadRes = await cloudinary.uploader.upload(localImagePath, {
          folder: "aqua-pets/products",
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
        imageUrl = uploadRes.secure_url;
        console.log(`   ✅ Cloudinary Image: ${imageUrl}`);
        break;
      } catch (uploadErr: any) {
        console.warn(`   ⚠️ Attempt ${attempt} failed:`, uploadErr?.message || uploadErr);
        if (attempt === 3) throw uploadErr;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  } else {
    console.warn(`   ⚠️ Local image file not found: ${localImagePath}`);
  }

  const productData = {
    slug: "sunsun-jp-013f-submersible-filter-pump",
    name: "SUNSUN JP-013F Submersible Filtration Pump",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 650,
    originalPrice: 650,
    discount: 0,
    rating: 4.8,
    reviewCount: 16,
    stock: 5,
    badge: "Compact Submersible",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.363,
    images: imageUrl ? [imageUrl] : [],
    description:
      "Keep your aquarium water moving with the SUNSUN JP-013F Submersible Filtration Pump. Designed for aquarium water circulation and filtration, this compact pump helps move water through its intake and outlet, supporting a cleaner and healthier aquarium environment.",
    fullDescription:
      "Keep your aquarium water moving, clear, and well-oxygenated with the SUNSUN JP-013F Submersible Filtration Pump. Designed for everyday aquarium water circulation and filtration, this compact internal filter pump draws water through its integrated intake louvers and passes it through high-efficiency mechanical sponge media before discharging it back into the aquarium.\n\nIts compact submersible architecture makes it convenient to install in small to medium freshwater and saltwater tanks using heavy-duty rubber suction mounts. The side-mounted aeration outlet nozzle draws in atmospheric oxygen, infusing micro-bubbles into the current to enhance dissolved oxygen levels.\n\nKey Highlights:\n• Submersible Internal Operation: Fully submersible motor engineered for dependable 24/7 continuous duty.\n• Efficient Water Circulation: Continuous water movement eliminates stagnant spots and prevents thermal stratification.\n• Mechanical & Bio Filtration Support: Slotted intake grills draw in debris, trapping particulate in the internal sponge cartridge.\n• Compact & Space-Saving: Compact profile fits easily behind plants or rocks without obstructing swimming space.\n• Freshwater & Saltwater Compatibility: Anti-corrosive housing and rotor suitable for fresh, marine, and turtle setups.\n• Simple Setup & Cleaning: Easy snap-off cartridge allows fast rinsing under aquarium water.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "JP-013F" },
      { label: "Product Type", value: "Submersible Filtration Pump" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Housing Material", value: "Durable ABS Plastic Housing" },
      { label: "Installation", value: "Submersible (Suction Mount)" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Aeration Feature", value: "Side-Mounted Oxygen Injection Port" },
      { label: "Product Weight", value: "0.363 kg (363 g)" },
      { label: "MRP", value: "₹650" },
      { label: "Selling Price", value: "₹650" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "jp-013f",
      "filtration pump",
      "submersible filter",
      "internal filter",
      "aquarium filter",
      "water pump",
      "freshwater",
      "saltwater",
    ],
  };

  const existing = await ProductModel.findOne({ slug: productData.slug });
  if (existing) {
    Object.assign(existing, productData);
    if (imageUrl && !existing.images.includes(imageUrl)) {
      existing.images = [imageUrl];
    }
    await existing.save();
    console.log(`   ✅ Updated existing DB document (ID: ${existing._id})`);
  } else {
    const created = await ProductModel.create(productData);
    console.log(`   ✅ Created new DB document (ID: ${created._id})`);
  }

  // Update Category Counts
  console.log(`\n📊 Updating Category Product Counts...`);
  const filterCatCount = await ProductModel.countDocuments({ category: "aquarium-filters" });
  await CategoryModel.updateOne({ slug: "aquarium-filters" }, { $set: { productCount: filterCatCount } });
  console.log(`   ✅ Category "aquarium-filters" productCount updated to ${filterCatCount}`);

  console.log("\n🎉 SUNSUN JP-013F added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
