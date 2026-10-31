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
});

const MONGO_URI =
  process.env.MONGODB_URI ||
  "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

// Uploaded media files
const USER_UPLOADED_DIR = "C:/Users/akshi/.gemini/antigravity-ide/brain/62086866-6b90-4d88-910f-43b0582795c3/.user_uploaded";
const MAIN_IMG_PATH = path.join(USER_UPLOADED_DIR, "media_1793164429970.jpg");
const BOX_IMG_PATH = path.join(USER_UPLOADED_DIR, "media_1793164424295.jpg");

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
  console.log("✅ Connected to MongoDB!");

  const uploadedImages: string[] = [];

  // 1. Upload Main Product Image
  if (fs.existsSync(MAIN_IMG_PATH)) {
    console.log("⬆️ Uploading Main Product Photo to Cloudinary...");
    const resMain = await cloudinary.uploader.upload(MAIN_IMG_PATH, {
      folder: "aqua-pets/products",
      public_id: "bluepet-bl-771w-bio-top-filter-main",
      overwrite: true,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    console.log("   ✅ Main Image Cloudinary URL:", resMain.secure_url);
    uploadedImages.push(resMain.secure_url);
  } else {
    console.warn("⚠️ Main image path not found:", MAIN_IMG_PATH);
  }

  // 2. Upload Box / Feature Infographic Image
  if (fs.existsSync(BOX_IMG_PATH)) {
    console.log("⬆️ Uploading Box Artwork to Cloudinary...");
    const resBox = await cloudinary.uploader.upload(BOX_IMG_PATH, {
      folder: "aqua-pets/products",
      public_id: "bluepet-bl-771w-bio-top-filter-box",
      overwrite: true,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    console.log("   ✅ Box Image Cloudinary URL:", resBox.secure_url);
    uploadedImages.push(resBox.secure_url);
  } else {
    console.warn("⚠️ Box image path not found:", BOX_IMG_PATH);
  }

  // 3. Product Data
  const productData = {
    slug: "bluepet-bl-771w-bio-top-filter",
    name: "Bluepet BL-771W Multi-Section Bio Top Filter",
    brand: "Bluepet",
    category: "aquarium-filters",
    description:
      "The Bluepet BL-771W Multi-Section Bio Top Filter is designed to help maintain clean and healthy aquarium water. Its multi-compartment filtration system accommodates different types of filter media to support mechanical and biological filtration. Equipped with a 6W pump and a maximum flow rate of 500 litres per hour, it is a practical choice for maintaining water quality in home aquariums.",
    fullDescription:
      "The Bluepet BL-771W Multi-Section Bio Top Filter is an advanced aquarium overhead filtration system designed to deliver superior water quality. Featuring multiple dedicated chambers, it allows aquarists to layer mechanical filter sponges, biological ceramic bio-balls, and chemical filter media for comprehensive purification.\n\nEquipped with an ultra-quiet, energy-efficient 6W submersible water pump delivering up to 500 L/H flow rate, it provides optimal water turnover, dissolved oxygenation, and crystal-clear clarity. The transparent acrylic casing allows you to monitor media cleanliness at a glance, while the snap-on design ensures effortless maintenance.\n\nKey Highlights:\n• Multi-Section Filtration: Multiple compartments for customized media layering.\n• Mechanical Filtration: Thick filter sponge captures suspended waste and debris.\n• Biological Filtration Support: Bio-balls and porous media foster beneficial bacteria.\n• 6W Power Consumption: Low power, whisper-quiet operation.\n• 500 L/H Max Flow Rate: Robust circulation suitable for small to medium tanks.\n• Compact & Sleek: Sits neatly atop the tank rim without occupying valuable swimming room.\n• Easy Maintenance: Removable compartments for quick rinsing.",
    price: 820,
    originalPrice: 820,
    discount: 0,
    rating: 4.9,
    reviewCount: 14,
    images: uploadedImages.length > 0 ? uploadedImages : [
      "https://res.cloudinary.com/xsxvzuhd/image/upload/v1793166246/aqua-pets/products/bluepet-bl-771w-bio-top-filter-main.jpg",
      "https://res.cloudinary.com/xsxvzuhd/image/upload/v1793166249/aqua-pets/products/bluepet-bl-771w-bio-top-filter-box.jpg"
    ],
    stock: 5,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.559,
    specifications: [
      { label: "Brand", value: "Bluepet" },
      { label: "Model", value: "BL-771W" },
      { label: "Filter Type", value: "Multi-Section Bio Top Filter" },
      { label: "Power Consumption", value: "6W" },
      { label: "Maximum Flow Rate", value: "500 L/H" },
      { label: "Product Weight", value: "0.559 kg (559 g)" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Media Included", value: "Filter Sponge, Bio Balls, Rotating Drum, Media Chamber" },
      { label: "Pump Included", value: "Yes (High-Flow 500 L/H Submersible Pump)" },
      { label: "MRP", value: "₹820" },
      { label: "Selling Price", value: "₹820" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "filter",
      "top filter",
      "bio filter",
      "bluepet",
      "bl-771w",
      "aquarium filter",
      "overhead filter",
      "6w pump",
      "500 l/h",
      "aquarium",
    ],
  };

  // 4. Upsert Product in MongoDB
  const existingProduct = await ProductModel.findOne({ slug: productData.slug });
  if (existingProduct) {
    Object.assign(existingProduct, productData);
    await existingProduct.save();
    console.log("✅ Updated existing product:", existingProduct.name, `(ID: ${existingProduct._id})`);
  } else {
    const newProduct = await ProductModel.create(productData);
    console.log("✅ Created new product:", newProduct.name, `(ID: ${newProduct._id})`);
  }

  // 5. Update Category Product Count
  const filterCatCount = await ProductModel.countDocuments({ category: "aquarium-filters" });
  await CategoryModel.updateOne({ slug: "aquarium-filters" }, { $set: { productCount: filterCatCount } });
  console.log(`📊 Updated "aquarium-filters" category count to ${filterCatCount}`);

  console.log("\n🎉 Product successfully added to Aqua Pets catalog & Cloudinary!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
