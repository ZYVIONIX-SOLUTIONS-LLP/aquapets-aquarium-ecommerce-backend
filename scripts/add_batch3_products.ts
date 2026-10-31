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
  // 1. Bluepet BLH-502 Slim Hanging Filter
  {
    slug: "bluepet-blh-502-slim-hanging-filter",
    name: "Bluepet BLH-502 Slim Hanging Filter",
    brand: "Bluepet",
    category: "aquarium-filters",
    price: 650,
    originalPrice: 650,
    discount: 0,
    rating: 4.8,
    reviewCount: 14,
    stock: 5,
    badge: "Dry & Wet Separation",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.404,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168879379.jpg"),
    cloudinaryPublicId: "bluepet-blh-502-slim-hanging-filter-main",
    description:
      "A compact, space-saving aquarium hanging filter designed to provide efficient filtration and help maintain clean, healthy water for freshwater and marine aquariums.",
    fullDescription:
      "The Bluepet BLH-502 Slim Hanging Filter is designed for convenient aquarium filtration with a slim, practical design. It hangs on the side of the aquarium, saving space inside the tank while supporting effective water filtration.\n\nIts filter box features separate dry and wet sections, and the filter screen is easy to clean. The unit also supports biochemical filtration with multi-stage filter sponge and bio ceramic rings to help maintain better aquarium water quality.\n\nKey Highlights:\n• Slim & Space-Saving Design: Hangs on the rim to maximize swimming room inside the tank.\n• Dry & Wet Separation: Innovative filter box layout separates media stages for superior waste breakdown.\n• Biochemical Filtration: Combines mechanical foam and porous bio-rings for optimal nitrogen cycle support.\n• Waterfall Return Flow: Generates soothing waterfall circulation and dissolved oxygenation.\n• Easy-to-Clean Filter Screen: Quick-release design allows hassle-free rinsing without disrupting the tank.\n• Suitable for Freshwater & Marine: Corrosion-resistant components built for all aquatic environments.",
    specifications: [
      { label: "Brand", value: "Bluepet" },
      { label: "Model", value: "BLH-502" },
      { label: "Product Type", value: "Slim Hanging Aquarium Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Filtration Style", value: "Dry & Wet Separation Biochemical Filtration" },
      { label: "Water Compatibility", value: "Freshwater & Marine Aquariums" },
      { label: "Product Weight", value: "0.404 kg (404 g)" },
      { label: "MRP", value: "₹650" },
      { label: "Selling Price", value: "₹650" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "bluepet",
      "blh-502",
      "slim filter",
      "hanging filter",
      "hob filter",
      "aquarium filter",
      "dry wet separation",
      "biochemical filter",
    ],
  },

  // 2. SunSun HBL-301 Hang-On Aquarium Filter
  {
    slug: "sunsun-hbl-301-hang-on-filter",
    name: "SunSun HBL-301 Hang-On Aquarium Filter",
    brand: "SunSun",
    category: "aquarium-filters",
    price: 760,
    originalPrice: 760,
    discount: 0,
    rating: 4.8,
    reviewCount: 18,
    stock: 5,
    badge: "Mute Operation",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.331,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168907424.jpg"),
    cloudinaryPublicId: "sunsun-hbl-301-hang-on-filter-main",
    description:
      "A compact hang-on aquarium filter designed to support efficient water filtration, biochemical filtration, and quiet operation for freshwater and marine aquariums.",
    fullDescription:
      "The SunSun HBL-301 Hang-On Filter is a practical filtration solution for aquarium enthusiasts. Its hang-on design saves space inside the aquarium while helping maintain clean and healthy water.\n\nFeaturing biochemical filtration and a convenient-to-clean design, this filter helps remove suspended impurities and supports beneficial bacteria that contribute to a healthier aquarium environment.\n\nKey Highlights:\n• Space-Saving Hang-On Installation: Mounts directly to the aquarium rim without taking up internal tank volume.\n• Biochemical Filtration: Multi-layer sponge and ceramic media cultivate beneficial nitrifying bacteria.\n• Waterfall Return Flow: Cascading waterfall return aerates the surface water and eliminates oily film.\n• Adjustable Outlet Direction: Directional nozzle can be easily adjusted for optimal current.\n• Mute Low-Noise Operation: Engineered with a quiet submersible motor for silent 24/7 duty.\n• Both for Fresh & Sea Water: High-grade ABS housing and ceramic shaft for freshwater and marine tanks.",
    specifications: [
      { label: "Brand", value: "SunSun" },
      { label: "Model", value: "HBL-301" },
      { label: "Product Type", value: "Hang-On Aquarium Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Filtration Type", value: "Biochemical & Mechanical Filtration" },
      { label: "Water Compatibility", value: "Freshwater & Marine Aquariums" },
      { label: "Operation", value: "Mute Low-Noise Operation" },
      { label: "Product Weight", value: "0.331 kg (331 g)" },
      { label: "MRP", value: "₹760" },
      { label: "Selling Price", value: "₹760" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hbl-301",
      "hang on filter",
      "hob filter",
      "aquarium filter",
      "biochemical filter",
      "waterfall flow",
      "mute filter",
    ],
  },

  // 3. RS-3000 Waterfall Style Bio Filter
  {
    slug: "rs-electrical-rs-3000-waterfall-bio-filter",
    name: "RS-3000 Waterfall Style Bio Filter",
    brand: "RS Electrical",
    category: "aquarium-filters",
    price: 900,
    originalPrice: 900,
    discount: 0,
    rating: 4.9,
    reviewCount: 20,
    stock: 5,
    badge: "Eco Green",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.787,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793168956653.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-3000-waterfall-bio-filter-main",
    description:
      "Maintain clean and healthy aquarium water with the RS-3000 Waterfall Style Bio Filter. Designed with a convenient hang-on installation, this filter circulates aquarium water and supports biological filtration to help maintain a healthier environment for your fish.",
    fullDescription:
      "Maintain clean and healthy aquarium water with the RS-3000 Waterfall Style Bio Filter from the RS Electrical Eco Green Series. Designed with a convenient hang-on installation, this filter circulates aquarium water and supports advanced biological filtration to help maintain a healthier environment for your fish.\n\nEquipped with an energy-efficient 7W motor, the RS-3000 draws water through a protective intake strainer and passes it through multi-stage mechanical sponge pads and biological ceramic rings before returning it via a wide cascading waterfall.\n\nKey Highlights:\n• Waterfall Style Flow: Broad cascading waterfall creates natural water movement, surface agitation, and superior oxygenation.\n• Biological Filtration Support: Spacious internal cartridge chamber holds bio-rings and dual-layer filter sponges.\n• 7W Eco Green Motor: Energy-saving design delivers reliable water turnover with minimal power draw.\n• Convenient Hang-On Installation: Mounts on the tank rim without occupying internal swimming area.\n• Protective Strainer: Prevents small fish and plant debris from entering the impeller.\n• Easy Maintenance: Removable cover and slide-out cartridge trays allow effortless cleaning.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model", value: "RS-3000" },
      { label: "Product Type", value: "Waterfall-Style Aquarium Bio Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power Consumption", value: "7W" },
      { label: "Series", value: "Eco Green Series" },
      { label: "Installation", value: "Hang-on Rim Mount" },
      { label: "Product Weight", value: "0.787 kg (787 g)" },
      { label: "MRP", value: "₹900" },
      { label: "Selling Price", value: "₹900" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-3000",
      "waterfall filter",
      "bio filter",
      "hang on filter",
      "aquarium filter",
      "eco green",
      "7w",
      "biological filtration",
    ],
  },

  // 4. RSElectrical RS-6000 Aquarium Hang-On Filter
  {
    slug: "rs-electrical-rs-6000-hang-on-filter",
    name: "RSElectrical RS-6000 Aquarium Hang-On Filter",
    brand: "RS Electrical",
    category: "aquarium-filters",
    price: 920,
    originalPrice: 920,
    discount: 0,
    rating: 4.9,
    reviewCount: 23,
    stock: 5,
    badge: "Surface Skimmer",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.578,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793169189160.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-6000-hang-on-filter-main",
    description:
      "Keep your aquarium water clean and well-circulated with the RSElectrical RS-6000 Aquarium Hang-On Filter. Featuring a compact hang-on design, this filter helps maintain water quality while saving space inside your aquarium. Its adjustable flow control allows you to regulate water circulation according to your aquarium's needs.",
    fullDescription:
      "Keep your aquarium water clean, crystal clear, and well-circulated with the RSElectrical RS-6000 Plus Slim Aquarium Hang-On Filter. Featuring a transparent slim profile, this filter integrates an active surface oil film skimmer with multi-stage mechanical and biological filtration.\n\nPowered by an ultra-efficient 3W motor with an impressive 350 L/H flow rate, it features a flow adjustment control dial, automatic re-start without manual water priming, and a special cascade waterfall outlet designed to maximize dissolved oxygen.\n\nKey Highlights:\n• Integrated Surface Oil Film Processor: Automatically skims and removes unsightly oily surface scum.\n• Slim Hang-On Architecture: Transparent space-saving casing mounts elegantly against aquarium glass.\n• 3W Eco Technology Motor: Consumes only 3W while generating a robust 350 L/H flow.\n• Flow Adjustment Dial: Dial on top allows fine-tuning water flow to match your fish's comfort.\n• Super-Quiet & Auto-Restart: Re-starts reliably after power interruptions without adding water.\n• Oxygen-Dissolving Waterfall: Wide cascade return maximizes gas exchange.\n• Dual-Layer Media Cartridge: Dense filter floss and bio sponge capture fine debris.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model", value: "RS-6000" },
      { label: "Product Type", value: "Aquarium Hang-On Filter with Surface Skimmer" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power Consumption", value: "3W" },
      { label: "Maximum Flow Rate", value: "350 L/H" },
      { label: "Surface Skimmer", value: "Integrated Oil Film Processor" },
      { label: "Water Compatibility", value: "Freshwater & Marine Aquariums" },
      { label: "Product Weight", value: "0.578 kg (578 g)" },
      { label: "MRP", value: "₹920" },
      { label: "Selling Price", value: "₹920" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-6000",
      "hang on filter",
      "surface skimmer",
      "oil film processor",
      "aquarium filter",
      "3w",
      "350 l/h",
      "slim filter",
    ],
  },

  // 5. RS Electrical RS-4000 Waterfall Style Bio-Filter
  {
    slug: "rs-electrical-rs-4000-waterfall-bio-filter",
    name: "RS Electrical RS-4000 Waterfall Style Bio-Filter",
    brand: "RS Electrical",
    category: "aquarium-filters",
    price: 1070,
    originalPrice: 1070,
    discount: 0,
    rating: 4.9,
    reviewCount: 27,
    stock: 5,
    badge: "10W High Power",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.85,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793169336804.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-4000-waterfall-bio-filter-main",
    description:
      "Maintain cleaner aquarium water and create a healthier aquatic environment with the RS Electrical RS-4000 Waterfall Style Bio-Filter. Designed for efficient filtration and continuous water circulation, this aquarium filter combines practical functionality with a convenient waterfall-style water flow.",
    fullDescription:
      "Maintain cleaner aquarium water and create a healthier aquatic environment with the RS Electrical RS-4000 Waterfall Style Bio-Filter from the RS Electrical Eco Green Series. Designed for high-volume filtration and robust continuous circulation, this aquarium filter combines heavy-duty performance with an elegant waterfall discharge.\n\nEquipped with a powerful 10W motor, the RS-4000 is engineered for medium to larger freshwater aquariums. It supports both comprehensive mechanical particle trapping and deep biological filtration via ceramic rings and multi-density foam pads.\n\nKey Highlights:\n• High-Output 10W Motor: Powerful pumping capacity for higher water volume turnover and crystal clarity.\n• Natural Waterfall Spillway: Creates an expansive cascading flow for superior surface agitation and oxygenation.\n• Dual Biological & Mechanical Chambers: Accommodates generous amounts of bio-rings, activated carbon, and filter floss.\n• Prevents Stagnant Dead Zones: Powerful circulation keeps waste suspended for effective filtration pickup.\n• Heavy-Duty Hang-On Mount: Sturdy bracket securely rests on standard tank rims.\n• Quick-Service Maintenance: Lift-off lid and modular trays make rinsing filter media fast and mess-free.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model", value: "RS-4000" },
      { label: "Product Type", value: "Waterfall Style Biological Filter" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Power Consumption", value: "10W" },
      { label: "Series", value: "Eco Green Series" },
      { label: "Filtration Style", value: "Mechanical & Biological Filtration" },
      { label: "Suitable For", value: "Compatible Freshwater Aquariums" },
      { label: "Product Weight", value: "0.850 kg (850 g)" },
      { label: "MRP", value: "₹1,070" },
      { label: "Selling Price", value: "₹1,070" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-4000",
      "waterfall filter",
      "bio filter",
      "hang on filter",
      "aquarium filter",
      "10w",
      "eco green",
      "high capacity filter",
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
  const filterCatCount = await ProductModel.countDocuments({ category: "aquarium-filters" });
  await CategoryModel.updateOne({ slug: "aquarium-filters" }, { $set: { productCount: filterCatCount } });
  console.log(`   ✅ Category "aquarium-filters" productCount updated to ${filterCatCount}`);

  console.log("\n🎉 All 5 batch-3 products added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
