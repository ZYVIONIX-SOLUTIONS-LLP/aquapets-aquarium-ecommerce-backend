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

const USER_UPLOADED_DIR = "C:/Users/akshi/.gemini/antigravity-ide/brain/62086866-6b90-4d88-910f-43b0582795c3/.user_uploaded";

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

interface ProductToUpload {
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: string;
  isFeatured: boolean;
  isStarterKit: boolean;
  isOffer: boolean;
  weightKg: number;
  localImagePath: string;
  cloudinaryPublicId: string;
  description: string;
  fullDescription: string;
  specifications: { label: string; value: string }[];
  tags: string[];
}

const productsToAdd: ProductToUpload[] = [
  // 1. RS Electrical RS-8003 Aquarium Hang-On Filter
  {
    slug: "rs-electrical-rs-8003-hang-on-filter",
    name: "RS Electrical RS-8003 Aquarium Hang-On Filter",
    brand: "RS Electrical",
    category: "aquarium-filters",
    price: 1280,
    originalPrice: 1280,
    discount: 0,
    rating: 4.9,
    reviewCount: 28,
    stock: 5,
    badge: "600 L/H High Flow",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.65,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793187921934.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-8003-hang-on-filter-main",
    description:
      "Give your aquarium cleaner water and a healthier environment with the RS Electrical RS-8003 Aquarium Hang-On Filter. Designed for efficient filtration and convenient installation, this filter helps remove suspended impurities while supporting beneficial bacteria that break down fish waste.",
    fullDescription:
      "Give your aquarium cleaner water and a healthier environment with the RS Electrical RS-8003 Plus Slim Aquarium Hang-On Filter. Designed for high-volume filtration and convenient external rim installation, this filter features an integrated surface oil film processor, high-capacity dual filter chambers, and an energy-efficient 4.5W motor generating an impressive 600 L/H flow rate.\n\nIts wide cascading waterfall-style output encourages optimal surface agitation and continuous dissolved oxygen exchange, creating a sparkling clean, refreshed aquatic environment. The built-in flow regulating dial gives you complete control over output intensity, while the auto-restart feature allows smooth re-activation after power interruptions without manual re-priming.\n\nKey Highlights:\n• High 600 L/H Flow Rate: Circulates water at up to 600 litres per hour for sparkling clear water.\n• Energy-Efficient 4.5W Operation: High-output continuous performance with ultra-low electricity draw.\n• Integrated Surface Oil Film Processor: Continuously skims and removes oily proteins and surface biofilm.\n• Waterfall-Style Flow: Cascading waterfall return aerates the surface water and maximizes oxygen dissolution.\n• Mechanical & Biological Filtration: Multi-stage chamber houses coarse sponges and biological media.\n• Adjustable Flow Control: Regulate water turbulence to suit delicate nano species or high-current setups.\n• Space-Saving Slim Design: Elegant transparent housing rests securely on the exterior tank rim.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model", value: "RS-8003" },
      { label: "Filter Type", value: "Hang-On Aquarium Filter with Surface Skimmer" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power Consumption", value: "4.5W" },
      { label: "Maximum Flow Rate", value: "600 L/H" },
      { label: "Surface Skimmer", value: "Integrated Oil Film Processor" },
      { label: "Suitable For", value: "Compatible Freshwater Aquariums" },
      { label: "Product Weight", value: "0.650 kg (650 g)" },
      { label: "MRP", value: "₹1,280" },
      { label: "Selling Price", value: "₹1,280" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-8003",
      "hang on filter",
      "surface skimmer",
      "oil film processor",
      "aquarium filter",
      "4.5w",
      "600 l/h",
      "slim filter",
    ],
  },

  // 2. SUNSUN HJ-611 Submersible Aquarium Pump
  {
    slug: "sunsun-hj-611-submersible-pump",
    name: "SUNSUN HJ-611 Submersible Aquarium Pump",
    brand: "SUNSUN",
    category: "water-pumps-circulation",
    price: 630,
    originalPrice: 630,
    discount: 0,
    rating: 4.8,
    reviewCount: 17,
    stock: 5,
    badge: "Adjustable Flow",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.241,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793187951290.jpg"),
    cloudinaryPublicId: "sunsun-hj-611-submersible-pump-main",
    description:
      "A compact and reliable submersible pump designed to maintain water circulation in your aquarium. Its durable construction and space-saving design make it a practical choice for everyday aquarium use.",
    fullDescription:
      "Keep your aquarium water moving and vibrant with the SUNSUN HJ-611 Submersible Aquarium Pump. Designed specifically for reliable aquarium water circulation, this compact power pump helps maintain consistent flow to prevent stagnant zones and support a cleaner, healthier aquatic environment.\n\nCrafted from durable, corrosion-resistant ABS plastic with high-grade waterproof insulation, the HJ-611 fits easily into aquariums, small sumps, and tabletop fountains. Its adjustable flow dial lets you regulate water volume according to the specific requirements of your fish and planted aquarium, while four rubber suction feet guarantee whisper-quiet, vibration-free operation.\n\nKey Highlights:\n• Durable ABS Housing: Anti-corrosive, high-impact shell engineered for lasting aquatic service.\n• Adjustable Water Flow: Front dial allows convenient regulation of water circulation output.\n• Submersible & Quiet Operation: Low-noise magnetic rotor designed for continuous underwater duty.\n• Efficient Water Circulation: Promotes gas exchange, prevents thermal stratification, and eliminates dead spots.\n• Compact & Space-Saving: Sits discreetly behind plants or decor without consuming swimming space.\n• Simple Tool-Free Setup: Easy to install and disassemble for routine impeller maintenance.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "HJ-611" },
      { label: "Product Type", value: "Submersible Aquarium Pump" },
      { label: "Category", value: "Water Pumps & Circulation" },
      { label: "Housing Material", value: "High-Grade ABS Plastic" },
      { label: "Flow Regulation", value: "Adjustable Front Flow Control Dial" },
      { label: "Application", value: "Aquarium Water Circulation & Filtration" },
      { label: "Product Weight", value: "0.241 kg (241 g)" },
      { label: "Water Compatibility", value: "Freshwater & Marine Aquariums" },
      { label: "MRP", value: "₹630" },
      { label: "Selling Price", value: "₹630" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hj-611",
      "submersible pump",
      "water pump",
      "circulation pump",
      "aquarium pump",
      "adjustable flow",
      "abs housing",
    ],
  },

  // 3. SUNSUN HQJ-500G Submersible Aquarium Pump
  {
    slug: "sunsun-hqj-500g-submersible-pump",
    name: "SUNSUN HQJ-500G Submersible Aquarium Pump",
    brand: "SUNSUN",
    category: "water-pumps-circulation",
    price: 520,
    originalPrice: 520,
    discount: 0,
    rating: 4.8,
    reviewCount: 21,
    stock: 5,
    badge: "Aeration Support",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.205,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793187964180.jpg"),
    cloudinaryPublicId: "sunsun-hqj-500g-submersible-pump-main",
    description:
      "A compact and durable submersible aquarium pump designed to support efficient water circulation. Suitable for compatible freshwater and marine aquarium setups, it helps maintain consistent water movement for your aquatic environment.",
    fullDescription:
      "Keep your aquarium water circulating reliably with the SUNSUN HQJ-500G Submersible Aquarium Pump. Built for versatility and longevity, this high-performance water pump provides consistent water movement and aeration to support healthy aquatic life in fresh and saltwater tanks.\n\nThe HQJ-500G features an anti-corrosive outer casing, high-insulation resin motor potting, and a high-lift water impeller. It includes an adjustable directional outlet nozzle and an optional air intake venturi nozzle to infuse water with fine oxygen bubbles without needing a separate air stone. A bottom intake strainer protects fish from the impeller while drawing in suspended waste for circulation.\n\nKey Highlights:\n• Strong & Consistent Water Flow: Keeps water flowing evenly for optimal gas exchange and clarity.\n• Anti-Corrosive Construction: Suitable for both freshwater and saltwater marine aquariums.\n• Adjustable Outlet Nozzle: Directional nozzle allows targeting water current where needed.\n• Optional Aeration Intake: Built-in venturi nipple draws air to oxygenate water as it pumps.\n• Bottom Protective Strainer: Prevents small fish and plant fragments from entering the pump chamber.\n• Compact & Energy Saving: Low electrical consumption with dependable long-lasting performance.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "HQJ-500G" },
      { label: "Product Type", value: "Submersible Aquarium Pump with Aeration Port" },
      { label: "Category", value: "Water Pumps & Circulation" },
      { label: "Housing Material", value: "Anti-Corrosive Resin & ABS" },
      { label: "Water Compatibility", value: "Freshwater & Marine Aquariums" },
      { label: "Application", value: "Water Circulation, Pumping & Aeration" },
      { label: "Product Weight", value: "0.205 kg (205 g)" },
      { label: "MRP", value: "₹520" },
      { label: "Selling Price", value: "₹520" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hqj-500g",
      "submersible pump",
      "water pump",
      "circulation pump",
      "aquarium pump",
      "aeration",
      "freshwater",
      "marine",
    ],
  },
];

async function main() {
  console.log("🌊 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB Atlas!");

  for (const item of productsToAdd) {
    console.log(`\n======================================================`);
    console.log(`📦 Processing Product: ${item.name} (${item.slug})`);

    let imageUrl = "";

    if (fs.existsSync(item.localImagePath)) {
      console.log(`⬆️ Uploading ${item.localImagePath} to Cloudinary...`);
      const uploadRes = await cloudinary.uploader.upload(item.localImagePath, {
        folder: "aqua-pets/products",
        public_id: item.cloudinaryPublicId,
        overwrite: true,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
      imageUrl = uploadRes.secure_url;
      console.log(`   ✅ Cloudinary Image: ${imageUrl}`);
    } else {
      console.warn(`   ⚠️ Local image file not found: ${item.localImagePath}`);
    }

    const productPayload = {
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      category: item.category,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      rating: item.rating,
      reviewCount: item.reviewCount,
      stock: item.stock,
      badge: item.badge,
      isFeatured: item.isFeatured,
      isStarterKit: item.isStarterKit,
      isOffer: item.isOffer,
      weightKg: item.weightKg,
      images: imageUrl ? [imageUrl] : [],
      description: item.description,
      fullDescription: item.fullDescription,
      specifications: item.specifications,
      tags: item.tags,
    };

    const existing = await ProductModel.findOne({ slug: item.slug });
    if (existing) {
      Object.assign(existing, productPayload);
      if (imageUrl && !existing.images.includes(imageUrl)) {
        existing.images = [imageUrl];
      }
      await existing.save();
      console.log(`   ✅ Updated existing DB document (ID: ${existing._id})`);
    } else {
      const created = await ProductModel.create(productPayload);
      console.log(`   ✅ Created new DB document (ID: ${created._id})`);
    }
  }

  // Update Category Counts
  console.log(`\n📊 Updating Category Product Counts...`);
  const categoriesToUpdate = ["aquarium-filters", "water-pumps-circulation"];

  for (const catSlug of categoriesToUpdate) {
    const count = await ProductModel.countDocuments({ category: catSlug });
    await CategoryModel.updateOne({ slug: catSlug }, { $set: { productCount: count } });
    console.log(`   ✅ Category "${catSlug}" productCount updated to ${count}`);
  }

  console.log("\n🎉 All 3 batch-4 products added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
