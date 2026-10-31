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
  // 1. Sunsun HJ-211 Submersible Aquarium Pump
  {
    slug: "sunsun-hj-211-submersible-pump",
    name: "Sunsun HJ-211 Submersible Aquarium Pump",
    brand: "Sunsun",
    category: "water-pumps-circulation",
    price: 390,
    originalPrice: 390,
    discount: 0,
    rating: 4.8,
    reviewCount: 12,
    stock: 5,
    badge: "Compact",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.139,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168012484.jpg"),
    cloudinaryPublicId: "sunsun-hj-211-submersible-pump-main",
    description:
      "The Sunsun HJ-211 Submersible Aquarium Pump is a compact water pump designed to support water circulation in freshwater and marine aquariums. Its space-saving design makes it suitable for aquarium setups requiring reliable water movement. It can be used in compatible aquarium filtration systems, fountains, and other water circulation applications.",
    fullDescription:
      "The Sunsun HJ-211 Submersible Aquarium Pump is an efficient, compact water circulation pump engineered for versatile use in freshwater aquariums, marine nano tanks, small water features, and tabletop fountains.\n\nFeaturing a high-efficiency motor with whisper-quiet operation, the HJ-211 provides steady water movement essential for maintaining healthy oxygen levels and preventing stagnant dead spots in your aquatic ecosystem. Built with durable ceramic-shaft components and four strong bottom suction cups, it ensures secure vibration-free placement on glass surfaces.\n\nKey Highlights:\n• Compact Design: Fits conveniently into compatible nano aquariums and sumps.\n• Submersible Operation: Designed to operate underwater with reliable continuous duty.\n• Freshwater & Marine Use: Suitable for both freshwater and saltwater applications.\n• Water Circulation: Helps maintain steady water movement and gas exchange.\n• Versatile Applications: Compatible with aquarium filtration, hydroponics, and fountains.\n• Easy Installation: Simple pump design with four strong suction cups for effortless setup.",
    specifications: [
      { label: "Brand", value: "Sunsun" },
      { label: "Model", value: "HJ-211" },
      { label: "Product Type", value: "Submersible Aquarium Pump" },
      { label: "Category", value: "Water Pumps & Circulation" },
      { label: "Product Weight", value: "0.139 kg (139 g)" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Mounting", value: "4 Heavy-Duty Rubber Suction Cups" },
      { label: "MRP", value: "₹390" },
      { label: "Selling Price", value: "₹390" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hj-211",
      "submersible pump",
      "water pump",
      "circulation pump",
      "aquarium pump",
      "freshwater",
      "marine",
      "compact pump",
    ],
  },

  // 2. SUNSUN AF-180 Aquarium Top Filter
  {
    slug: "sunsun-af-180-top-filter",
    name: "SUNSUN AF-180 Aquarium Top Filter",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 850,
    originalPrice: 850,
    discount: 0,
    rating: 4.9,
    reviewCount: 16,
    stock: 5,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.38,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168020976.jpg"),
    cloudinaryPublicId: "sunsun-af-180-top-filter-main",
    description:
      "Keep your aquarium water cleaner with the SUNSUN AF-180 Top Filter. Designed for efficient water filtration, this filter helps remove suspended particles and supports healthy water circulation for your aquarium.",
    fullDescription:
      "The SUNSUN AF-180 is a top-mounted aquarium filter designed to provide convenient filtration and water circulation. Its multi-section filter box accommodates filter media, helping trap debris and maintain superior water quality.\n\nThe waterfall-style water outlet returns filtered water to the aquarium, supporting surface movement and oxygen exchange. Its compact modular design makes it a practical choice for freshwater aquarium setups, and multiple units can be linked together for expanded filtration capacity.\n\nKey Highlights:\n• Top-Mounted Filtration: Sits neatly on top of the aquarium rim, saving precious swimming room.\n• Multi-Section Filter Box: Spacious compartments for mechanical sponge and biological media.\n• Waterfall-Style Outlet: Promotes surface agitation, gas exchange, and dissolved oxygen levels.\n• Multiple Units Linkable: Expandable design allows chaining units for larger tanks.\n• Adjustable Intake Pipe: Telescopic strainer adapts easily to various aquarium water depths.\n• Whisper-Quiet Operation: Engineered for high-efficiency, low-noise continuous filtration.\n• Package Includes: Filter box unit, intake pipe, strainer, elbow connectors, and fittings.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "AF-180" },
      { label: "Product Type", value: "Top Filter / Waterfall Filter Box" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Filtration Style", value: "Multi-Section Mechanical & Biological" },
      { label: "Water Outlet", value: "Wide Waterfall Flow Design" },
      { label: "Intake", value: "Adjustable Telescopic Intake Pipe" },
      { label: "Suitable For", value: "Compatible Freshwater Aquariums" },
      { label: "Product Weight", value: "0.380 kg (380 g)" },
      { label: "MRP", value: "₹850" },
      { label: "Selling Price", value: "₹850" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "af-180",
      "top filter",
      "waterfall filter",
      "aquarium filter",
      "overhead filter",
      "filter box",
      "freshwater filter",
    ],
  },

  // 3. RS Electrical RS-380P 3-in-1 Aquarium Submersible Pump
  {
    slug: "rs-electrical-rs-380p-submersible-pump",
    name: "RS Electrical RS-380P 3-in-1 Aquarium Submersible Pump",
    brand: "RS Electrical",
    category: "water-pumps-circulation",
    price: 760,
    originalPrice: 760,
    discount: 0,
    rating: 4.8,
    reviewCount: 19,
    stock: 5,
    badge: "3-in-1",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.238,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168132578.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-380p-submersible-pump-main",
    description:
      "A compact 3-in-1 aquarium pump designed for water circulation, oxygenation, and aquarium water movement. Its energy-efficient 7W motor and 600 L/H flow rate make it suitable for everyday aquarium maintenance.",
    fullDescription:
      "The RS Electrical RS-380P 3-in-1 Aquarium Submersible Pump is designed to support a healthy aquarium environment. It helps circulate aquarium water and provides water movement to improve circulation and oxygen exchange.\n\nIts compact design makes it convenient for freshwater aquariums and suitable aquarium setups. The pump features a 7W power rating, a maximum flow rate of 600 litres per hour, and a maximum pumping lift of 0.7 metres.\n\nKey Highlights:\n• 3-in-1 Multi-Function Design: Supports water pumping, aeration oxygenation, and circulation.\n• 7W Power Consumption: Highly energy-efficient motor for economical continuous operation.\n• 600 L/H Maximum Flow Rate: Robust circulation keeps water sparkling clean.\n• 0.7 Metres Maximum Lift: Capable of pumping water to overhead top filters or fountains.\n• Submersible & Low-Noise: Whisper-quiet magnetic impeller for peaceful environments.\n• Modular Attachments: Includes extension pipes, elbow fittings, and protective bottom strainer.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model", value: "RS-380P" },
      { label: "Product Type", value: "3-in-1 Submersible Aquarium Pump" },
      { label: "Category", value: "Water Pumps & Circulation" },
      { label: "Power", value: "7W" },
      { label: "Maximum Flow Rate", value: "600 L/H" },
      { label: "Maximum Lift", value: "0.7 m" },
      { label: "Product Weight", value: "0.238 kg (238 g)" },
      { label: "MRP", value: "₹760" },
      { label: "Selling Price", value: "₹760" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-380p",
      "3-in-1 pump",
      "submersible pump",
      "powerhead",
      "water pump",
      "7w",
      "600 l/h",
      "oxygenation",
    ],
  },

  // 4. Bluepet BLH-301 Hang-On Aquarium Filter
  {
    slug: "bluepet-blh-301-hang-on-filter",
    name: "Bluepet BLH-301 Hang-On Aquarium Filter",
    brand: "Bluepet",
    category: "aquarium-filters",
    price: 390,
    originalPrice: 390,
    discount: 0,
    rating: 4.8,
    reviewCount: 15,
    stock: 5,
    badge: "Ultra Quiet",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.185,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168215710.jpg"),
    cloudinaryPublicId: "bluepet-blh-301-hang-on-filter-main",
    description:
      "Compact, low-noise hang-on aquarium filter designed to help maintain clean and healthy aquarium water.",
    fullDescription:
      "The Bluepet BLH-301 Hang-On Filter is a compact filtration solution for freshwater and suitable marine aquariums. Its hang-on design helps save space inside the aquarium while providing continuous water filtration.\n\nWith a 3W power rating and a maximum flow rate of 180 litres per hour, this filter is suitable for small aquarium setups that require gentle water circulation and filtration.\n\nKey Highlights:\n• Space-Saving Hang-On Design: Mounts securely on the exterior tank glass rim.\n• Compact Filtration System: Fits neatly on small nano tanks, desktop aquariums, and shrimp bowls.\n• Innovative Ultra-Quiet Operation: Engineered with a low-noise submersible motor.\n• 3W Power Consumption: Minimal energy usage.\n• 180 L/H Maximum Flow Rate: Gentle waterfall return that aerates without overwhelming fish.\n• Clear Transparent Chamber: Enables easy visual checks of the filter sponge cartridge.",
    specifications: [
      { label: "Brand", value: "Bluepet" },
      { label: "Model", value: "BLH-301" },
      { label: "Product Type", value: "Hang-On Aquarium Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power", value: "3W" },
      { label: "Maximum Flow Rate", value: "180 L/H" },
      { label: "Product Weight", value: "0.185 kg (185 g)" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "MRP", value: "₹390" },
      { label: "Selling Price", value: "₹390" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "bluepet",
      "blh-301",
      "hang on filter",
      "hob filter",
      "aquarium filter",
      "nano filter",
      "3w",
      "180 l/h",
      "quiet filter",
    ],
  },

  // 5. Bluepet BLH-401 Hang-On Aquarium Filter
  {
    slug: "bluepet-blh-401-hang-on-filter",
    name: "Bluepet BLH-401 Hang-On Aquarium Filter",
    brand: "Bluepet",
    category: "aquarium-filters",
    price: 460,
    originalPrice: 460,
    discount: 0,
    rating: 4.9,
    reviewCount: 22,
    stock: 5,
    badge: "Popular",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.206,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168250584.jpg"),
    cloudinaryPublicId: "bluepet-blh-401-hang-on-filter-main",
    description:
      "A compact hang-on aquarium filter designed to support clean aquarium water with efficient filtration, low-noise operation, and space-saving installation.",
    fullDescription:
      "The Bluepet BLH-401 Hang-On Filter is designed for aquarium owners looking for a convenient water filtration solution. Its hang-on design helps save space inside the aquarium while supporting continuous water circulation and filtration.\n\nWith a 4W power rating and a maximum water flow rate of 250 litres per hour, this filter is suitable for aquarium setups requiring moderate water movement.\n\nKey Highlights:\n• Space-Saving Hang-On Design: Hangs on the rim to maximize unobstructed swimming space.\n• 4W Power Consumption: Efficient and reliable 24/7 continuous operation.\n• 250 L/H Maximum Flow Rate: Generates optimal circulation for nano and small aquariums.\n• Multi-Stage Filtration: Multi-density filter sponges trap solid particulate and host biological bacteria.\n• Adjustable Flow Dial: Easily regulate water flow rate to match delicate aquatic life.\n• Low-Noise Damping System: Advanced muffler and motor damping keep vibration whisper quiet.",
    specifications: [
      { label: "Brand", value: "Bluepet" },
      { label: "Model", value: "BLH-401" },
      { label: "Product Type", value: "Hang-On Aquarium Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power", value: "4W" },
      { label: "Maximum Flow Rate", value: "250 L/H" },
      { label: "Flow Regulation", value: "Adjustable Water Flow Control Dial" },
      { label: "Product Weight", value: "0.206 kg (206 g)" },
      { label: "MRP", value: "₹460" },
      { label: "Selling Price", value: "₹460" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "bluepet",
      "blh-401",
      "hang on filter",
      "hob filter",
      "aquarium filter",
      "adjustable flow",
      "4w",
      "250 l/h",
      "multi-stage filtration",
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
  const categoriesToUpdate = ["water-pumps-circulation", "aquarium-filters"];

  for (const catSlug of categoriesToUpdate) {
    const count = await ProductModel.countDocuments({ category: catSlug });
    await CategoryModel.updateOne({ slug: catSlug }, { $set: { productCount: count } });
    console.log(`   ✅ Category "${catSlug}" productCount updated to ${count}`);
  }

  console.log("\n🎉 All 5 products added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
