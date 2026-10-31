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
  // 1. SUNSUN HJ-411B Submersible Filtration Pump
  {
    slug: "sunsun-hj-411b-submersible-filter-pump",
    name: "SUNSUN HJ-411B Submersible Filtration Pump",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 560,
    originalPrice: 560,
    discount: 0,
    rating: 4.8,
    reviewCount: 14,
    stock: 5,
    badge: "Spray Bar Included",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.228,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793201389380.jpg"),
    cloudinaryPublicId: "sunsun-hj-411b-submersible-filter-pump-main",
    description:
      "Keep your aquarium water circulating with the SUNSUN HJ-411B Submersible Filtration Pump. Designed for aquarium filtration and water movement, this compact pump helps maintain circulation throughout your tank. The included spray bar distributes water through multiple outlets, helping create an even flow and improve water movement. Its submersible design allows convenient installation inside a compatible aquarium setup.",
    fullDescription:
      "Keep your aquarium water crystal clear and well-aerated with the SUNSUN HJ-411B Submersible Filtration Pump. Combining internal mechanical filtration with continuous water circulation, this compact power filter is an ideal choice for small to medium freshwater and marine aquariums.\n\nThe HJ-411B includes an adjustable multi-hole rain spray bar that gently cascades return water across the water surface, maximizing dissolved oxygen levels and preventing stagnant film. The internal filtration chamber houses high-density filter sponge media to trap floating debris, fish waste, and uneaten food while providing a surface area for beneficial biological bacteria.\n\nKey Highlights:\n• Submersible Internal Design: Mounts securely inside the tank using heavy-duty rubber suction cups.\n• Multi-Hole Spray Bar Included: Distributes clean water evenly to create soothing rain-fall surface agitation.\n• Mechanical & Biological Filtration: Internal sponge cartridge captures particulate waste and supports bio-filtration.\n• Freshwater & Saltwater Use: Corrosion-resistant motor and impeller suitable for both fresh and marine tanks.\n• Quiet & Energy-Efficient: Engineered for whisper-quiet continuous 24/7 duty.\n• Easy Maintenance: Snap-lock filter cartridge disassembles easily for quick sponge rinsing.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "HJ-411B" },
      { label: "Product Type", value: "Aquarium Submersible Filter Pump" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Key Feature", value: "Multi-Hole Rain Spray Bar Included" },
      { label: "Installation", value: "Submersible (Suction Mount)" },
      { label: "Housing Material", value: "Durable Plastic" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Product Weight", value: "0.228 kg (228 g)" },
      { label: "MRP", value: "₹560" },
      { label: "Selling Price", value: "₹560" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hj-411b",
      "submersible filter",
      "filtration pump",
      "internal filter",
      "spray bar",
      "aquarium filter",
      "freshwater",
      "saltwater",
    ],
  },

  // 2. SUNSUN HJ-611B Submersible Filtration Pump
  {
    slug: "sunsun-hj-611b-submersible-filter-pump",
    name: "SUNSUN HJ-611B Submersible Filtration Pump",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 690,
    originalPrice: 690,
    discount: 0,
    rating: 4.8,
    reviewCount: 19,
    stock: 5,
    badge: "Spray Bar & Aeration",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.32,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793201527542.jpg"),
    cloudinaryPublicId: "sunsun-hj-611b-submersible-filter-pump-main",
    description:
      "Keep your aquarium water clean and healthy with the SUNSUN HJ-611B Submersible Filtration Pump. Designed for aquarium water circulation and filtration, this compact pump helps maintain a cleaner aquatic environment for your fish.",
    fullDescription:
      "Maintain optimal water clarity and healthy circulation with the SUNSUN HJ-611B Submersible Filtration Pump. Engineered with an upgraded high-lift motor and an extended internal filtration canister, this submersible filter provides dependable multi-stage purification for freshwater and marine aquariums.\n\nThe unit comes equipped with both a wide multi-outlet rain spray bar and a high-flow aeration nozzle, allowing flexible configuration depending on whether you require tranquil surface agitation or vigorous oxygenation. The slotted intake chamber draws in suspended waste from all angles, passing it through porous bio-sponges that trap debris and culture beneficial nitrifying colonies.\n\nKey Highlights:\n• Dual Output Options: Includes both a wide rain spray bar and an aeration nozzle with air tube.\n• High-Efficiency Internal Filtration: Removes suspended dirt, cloudiness, and organic waste particles.\n• Multi-Directional Intake: Lower intake grills pull waste from the substrate level for cleaner tank bottoms.\n• Freshwater & Saltwater Duty: Durable ceramic-shaft construction resists corrosion.\n• Silent Underwater Operation: Submerged design dampens motor vibration for silent living room enjoyment.\n• Quick-Release Canister: Effortless disassembly for routine sponge rinsing.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "HJ-611B" },
      { label: "Product Type", value: "Submersible Internal Filtration Pump" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Accessories Included", value: "Rain Spray Bar, Aeration Nozzle, Suction Bracket" },
      { label: "Product Weight", value: "0.320 kg (320 g)" },
      { label: "MRP", value: "₹690" },
      { label: "Selling Price", value: "₹690" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "hj-611b",
      "submersible filter",
      "filtration pump",
      "internal filter",
      "spray bar",
      "aquarium filter",
      "aeration",
      "freshwater",
      "marine",
    ],
  },

  // 3. SUNSUN JP-022F Submersible Filtration Pump
  {
    slug: "sunsun-jp-022f-submersible-filter-pump",
    name: "SUNSUN JP-022F Submersible Filtration Pump",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 900,
    originalPrice: 900,
    discount: 0,
    rating: 4.8,
    reviewCount: 22,
    stock: 5,
    badge: "Aeration Venturi",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.45,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793201860634.jpg"),
    cloudinaryPublicId: "sunsun-jp-022f-submersible-filter-pump-main",
    description:
      "Maintain a cleaner and healthier aquarium with the SUNSUN JP-022F Filtration Pump. Designed for aquarium water circulation and filtration, this pump helps keep water moving and supports a healthy aquatic environment.",
    fullDescription:
      "Ensure superior water quality and dynamic circulation with the SUNSUN JP-022F Submersible Filtration Pump. Designed for medium-sized freshwater and saltwater aquariums, the JP-022F combines a powerful top-mounted powerhead with a spacious modular filter cartridge.\n\nEquipped with a directional water nozzle and an integrated aeration venturi inlet, it infuses thousands of micro-bubbles into the water column to maximize dissolved oxygen. The large-capacity filter canister houses multi-density filtration sponge media that traps particulate solids while providing a thriving habitat for biological filtration bacteria.\n\nKey Highlights:\n• High-Performance Powerhead: Strong pumping action ensures thorough water turnover throughout the aquarium.\n• Aeration Venturi System: Draws in atmospheric air to produce fine oxygen micro-bubbles without a separate air pump.\n• High-Capacity Filter Cartridge: Spacious media chamber ensures long intervals between cleanings.\n• Universal Water Compatibility: Suitable for planted freshwater tanks, cichlid aquariums, and marine setups.\n• Heavy-Duty Glass Mounting: Strong rear suction cups hold the pump firmly against aquarium glass.\n• Modular Cleaning Design: Bottom canister detaches with a simple twist for fast, mess-free rinsing.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "JP-022F" },
      { label: "Product Type", value: "Submersible Filtration Pump & Powerhead" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Application", value: "Mechanical Filtration, Water Circulation & Aeration" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Aeration", value: "Built-in Venturi Air Injection Port" },
      { label: "Product Weight", value: "0.450 kg (450 g)" },
      { label: "MRP", value: "₹900" },
      { label: "Selling Price", value: "₹900" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "jp-022f",
      "filtration pump",
      "submersible filter",
      "internal filter",
      "powerhead",
      "aquarium filter",
      "aeration",
    ],
  },

  // 4. SUNSUN JP-023F Submersible Filtration Pump
  {
    slug: "sunsun-jp-023f-submersible-filter-pump",
    name: "SUNSUN JP-023F Submersible Filtration Pump",
    brand: "SUNSUN",
    category: "aquarium-filters",
    price: 1150,
    originalPrice: 1150,
    discount: 0,
    rating: 4.9,
    reviewCount: 26,
    stock: 5,
    badge: "Dual Canister",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.62,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793202207988.jpg"),
    cloudinaryPublicId: "sunsun-jp-023f-submersible-filter-pump-main",
    description:
      "Keep your aquarium water circulating with the SUNSUN JP-023F Submersible Filtration Pump. Designed for aquarium filtration systems, this pump helps maintain water movement and supports a cleaner aquatic environment for your fish.",
    fullDescription:
      "Experience high-capacity multi-stage internal filtration with the SUNSUN JP-023F Submersible Filtration Pump. Featuring an extended dual-chamber filter canister and a robust high-output motor, the JP-023F is engineered for larger aquariums, high-bioload tanks, and community fish setups.\n\nIts elongated cylindrical design maximizes water-to-media contact time, pulling water through multiple layers of mechanical sponge and biological media before ejecting it with powerful circulation. The discharge nozzle features an integrated air venturi that oxygenates the tank, while the modular canisters can be customized with different media such as ceramic bio-rings or activated carbon.\n\nKey Highlights:\n• Extended Dual-Canister Filtration: Twice the filter volume for superior mechanical particle capture and bio-filtration.\n• Powerful Water Turnover: High-flow submersible motor provides robust circulation for large tanks.\n• Dual-Stage Aeration & Flow: Built-in venturi injector enriches water with essential dissolved oxygen.\n• Customizable Media Chambers: Stackable canisters can be loaded with sponges, bio-rings, or chemical media.\n• Fully Submersible: Operates vertically or horizontally inside fresh and saltwater setups.\n• Rugged Construction: Durable waterproof motor block with heavy-duty mounting bracket and suction cups.",
    specifications: [
      { label: "Brand", value: "SUNSUN" },
      { label: "Model", value: "JP-023F" },
      { label: "Product Type", value: "Dual-Chamber Submersible Filtration Pump" },
      { label: "Category", value: "Aquarium Filters" },
      { label: "Filtration Style", value: "Dual-Stage Mechanical & Biological Filtration" },
      { label: "Water Compatibility", value: "Freshwater & Saltwater" },
      { label: "Aeration Feature", value: "Integrated Venturi Oxygen Injection" },
      { label: "Product Weight", value: "0.620 kg (620 g)" },
      { label: "MRP", value: "₹1,150" },
      { label: "Selling Price", value: "₹1,150" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "sunsun",
      "jp-023f",
      "filtration pump",
      "dual canister",
      "submersible filter",
      "internal filter",
      "high capacity",
      "aquarium filter",
      "large tank filter",
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
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`⬆️ [Attempt ${attempt}] Uploading ${item.localImagePath} to Cloudinary...`);
          const uploadRes = await cloudinary.uploader.upload(item.localImagePath, {
            folder: "aqua-pets/products",
            public_id: item.cloudinaryPublicId,
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

  console.log("\n🎉 All 4 batch-6 products added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
