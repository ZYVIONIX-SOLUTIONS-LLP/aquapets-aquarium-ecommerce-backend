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
  // 1. BluePet Mist Maker
  {
    slug: "bluepet-mist-maker",
    name: "BluePet Ultrasonic Mist Maker",
    brand: "BluePet",
    category: "aquarium-decorations",
    price: 1050,
    originalPrice: 1050,
    discount: 0,
    rating: 4.9,
    reviewCount: 16,
    stock: 5,
    badge: "Fine Mist",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.28,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793197817868.jpg"),
    cloudinaryPublicId: "bluepet-mist-maker-main",
    description:
      "Create a beautiful mist effect in your aquarium or decorative water feature with the BluePet Mist Maker. Designed with a ceramic membrane, this compact device produces fine water mist, adding an attractive visual effect to suitable aquarium and water-feature setups.",
    fullDescription:
      "Create a stunning atmospheric mist effect in your aquarium, paludarium, terrarium, or indoor water fountain with the BluePet Ultrasonic Mist Maker.\n\nEquipped with a high-frequency 16/20 mm ceramic disc transducer, this compact stainless-steel unit atomizes water into a dense, cool vapor cloud without heat or chemicals. Producing ≥300 ml/h of vapor output with an operating life exceeding 3,000 hours, it adds a mystical visual dimension while helping maintain optimal ambient humidity for amphibians, mosses, and tropical plants.\n\nKey Highlights:\n• High-Frequency Ultrasonic Atomization: Converts water into ultra-fine cool mist without heating.\n• Durable Stainless Steel & Ceramic Build: Long-lasting ceramic membrane rated for over 3,000 operating hours.\n• ≥300 ml/h Mist Generation: Generates lush, rolling fog for aquariums, paludariums, and fountains.\n• Built-in Water-Level Sensor: Automatically shuts down when water level is insufficient for safe operation.\n• 24V Low Voltage Operation: Safe underwater 24V AC/DC low-voltage power requirement.\n• Compact & Submersible: Sits discreetly in shallow water containers or waterfall ledges.",
    specifications: [
      { label: "Brand", value: "BluePet" },
      { label: "Product Type", value: "Ultrasonic Mist Maker / Fogger" },
      { label: "Category", value: "Aquarium Decorations & Accessories" },
      { label: "Rated Voltage", value: "24V AC/DC" },
      { label: "Rated Current", value: "0.4–0.6A" },
      { label: "Ceramic Membrane Size", value: "16/20 mm" },
      { label: "Water Output", value: "≥300 ml/hour" },
      { label: "Operating Temperature", value: "0–40°C" },
      { label: "Ceramic Disc Life", value: ">3,000 Hours" },
      { label: "Product Weight", value: "0.280 kg (280 g)" },
      { label: "MRP", value: "₹1,050" },
      { label: "Selling Price", value: "₹1,050" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "bluepet",
      "mist maker",
      "fogger",
      "ultrasonic",
      "paludarium",
      "terrarium",
      "aquarium accessories",
      "water feature",
      "decorations",
    ],
  },

  // 2. RS Electrical RS-A98 Aquarium Super Air Pump – 10W
  {
    slug: "rs-electrical-rs-a98-super-air-pump",
    name: "RS Electrical Aquarium Super Air Pump RS-A98 – 10W",
    brand: "RS Electrical",
    category: "air-pumps-accessories",
    price: 2020,
    originalPrice: 2020,
    discount: 0,
    rating: 4.9,
    reviewCount: 31,
    stock: 5,
    badge: "10W High Power",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.85,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793198346492.jpg"),
    cloudinaryPublicId: "rs-electrical-rs-a98-super-air-pump-main",
    description:
      "Keep your aquarium fresh, vibrant, and healthy with the RS Electrical RS-A98 Aquarium Super Air Pump. Designed to provide a continuous supply of air to your aquarium, this powerful 10W air pump helps improve water oxygenation and supports a healthier environment for your aquatic pets.",
    fullDescription:
      "Keep your aquarium oxygen-rich, fresh, and vibrant with the RS Electrical RS-A98 Aquarium Super Air Pump. Engineered for heavy-duty multi-tank aeration, this powerful 10W air pump delivers high-volume air output through four individual brass outlet nozzles.\n\nHoused in a sleek, sound-damped dual-chamber white-and-black chassis, the RS-A98 features multi-level acoustic baffling and high-grade rubber feet to isolate vibration and minimize ambient hum. A top-mounted variable speed control dial allows precision adjustment of airflow, making it ideal for running multiple air stones, sponge filters, and bubble curtains simultaneously.\n\nKey Highlights:\n• High-Output 10W Motor: Powerful diaphragm motor designed for large tanks and deep-water pressure.\n• 4 Independent Air Outlets: Distributes high-pressure air to up to four accessories or aquariums at once.\n• Adjustable Electronic Flow Control: Top dial allows stepless airflow regulation to match tank requirements.\n• Super Quiet Multi-Chamber Damping: Dual noise-dampening chambers keep operating sound whisper quiet.\n• Maximizes Dissolved Oxygen: Enhances gas exchange, biological filter activity, and fish vitality.\n• Heavy-Duty Vibration Absorbing Feet: Prevents creep and eliminates vibration transfer to surfaces.",
    specifications: [
      { label: "Brand", value: "RS Electrical" },
      { label: "Model Number", value: "RS-A98" },
      { label: "Product Type", value: "Super Air Pump (4 Outlets)" },
      { label: "Category", value: "Air Pumps & Accessories" },
      { label: "Rated Power", value: "10W" },
      { label: "Air Outlets", value: "4 Individual Metal Nozzles" },
      { label: "Colour", value: "White & Black" },
      { label: "Usage", value: "Freshwater & Marine Aeration" },
      { label: "Product Weight", value: "0.850 kg (850 g)" },
      { label: "MRP", value: "₹2,020" },
      { label: "Selling Price", value: "₹2,020" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "rs electrical",
      "rs-a98",
      "air pump",
      "super air pump",
      "10w",
      "4 outlets",
      "aeration",
      "aquarium air pump",
      "high power",
    ],
  },

  // 3. Bluepet BL-710S 4-Way Aquarium Air Pump
  {
    slug: "bluepet-bl-710s-4-way-air-pump",
    name: "Bluepet BL-710S 4-Way Aquarium Air Pump",
    brand: "Bluepet",
    category: "air-pumps-accessories",
    price: 850,
    originalPrice: 850,
    discount: 0,
    rating: 4.8,
    reviewCount: 24,
    stock: 5,
    badge: "4 Outlets",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.642,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793198366653.jpg"),
    cloudinaryPublicId: "bluepet-bl-710s-4-way-air-pump-main",
    description:
      "Keep your aquarium fresh and your fish healthy with the Bluepet BL-710S 4-Way Aquarium Air Pump. Designed with four air outlets, this pump allows you to supply air to multiple aquarium accessories simultaneously. It helps improve oxygen circulation in aquarium water, creating a healthier and more comfortable environment for your fish.",
    fullDescription:
      "Maintain optimal dissolved oxygen levels across your aquatic setup with the Bluepet BL-710S 4-Way Aquarium Air Pump. Featuring four dedicated metal outlet nipples, it allows you to run multiple air lines for sponge filters, bubble walls, and breeder boxes from a single neat unit.\n\nEngineered with an ultra-low-vibration diaphragm and quiet acoustic enclosure, the BL-710S operates with minimal hum while providing continuous, reliable airflow. Its clean aesthetic and dependable performance make it an essential centerpiece for hobbyists managing multiple or large aquariums.\n\nKey Highlights:\n• 4-Way Air Distribution: Power up to four separate aeration accessories without needing splitters or T-valves.\n• High-Efficiency Aeration: Continuously infuses water with life-giving oxygen for fish and beneficial bacteria.\n• Low-Noise Silent Operation: Advanced motor suspension dampens vibration for quiet home and office use.\n• Durable Long-Life Diaphragms: Engineered from premium synthetic rubber for consistent output year after year.\n• Energy-Saving Performance: Economical electricity consumption for uninterrupted 24/7 duty.\n• Clean Compact Styling: Fits easily inside aquarium cabinets or beside tanks.",
    specifications: [
      { label: "Brand", value: "Bluepet" },
      { label: "Model", value: "BL-710S" },
      { label: "Product Type", value: "4-Way Aquarium Air Pump" },
      { label: "Category", value: "Air Pumps & Accessories" },
      { label: "Number of Outlets", value: "4 Metal Outlets" },
      { label: "Application", value: "Aquarium Aeration" },
      { label: "Product Weight", value: "0.642 kg (642 g)" },
      { label: "MRP", value: "₹850" },
      { label: "Selling Price", value: "₹850" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "bluepet",
      "bl-710s",
      "4-way air pump",
      "air pump",
      "aquarium air pump",
      "aeration",
      "sponge filter pump",
      "4 outlets",
    ],
  },

  // 4. Hailea ACO-208 Electrical Magnetic Air Compressor
  {
    slug: "hailea-aco-208-air-compressor",
    name: "Hailea ACO-208 Electrical Magnetic Air Compressor",
    brand: "Hailea",
    category: "air-pumps-accessories",
    price: 2550,
    originalPrice: 2550,
    discount: 0,
    rating: 4.9,
    reviewCount: 35,
    stock: 5,
    badge: "Aluminium Alloy",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    weightKg: 0.95,
    localImagePath: path.join(USER_UPLOADED_DIR, "media_1793198475336.jpg"),
    cloudinaryPublicId: "hailea-aco-208-air-compressor-main",
    description:
      "Give your aquarium a reliable air supply with the Hailea ACO-208 Electrical Magnetic Air Compressor. Designed for aquarium aeration, this compressor features a sturdy aluminium alloy housing and a practical design suited to demanding aquarium setups.",
    fullDescription:
      "Deliver industrial-grade aeration to your aquariums, fish breeding racks, or commercial aquatic systems with the Hailea ACO-208 Electrical Magnetic Air Compressor.\n\nManufactured with high-quality ZL102 aluminium alloy for rapid heat dissipation and streamlined durability, the ACO-208 utilizes an oil-free electrical magnetic piston design to produce clean, uncontaminated compressed air. The innovative wear-resistant cylinder and piston assembly deliver high pressure and high volume output with low electrical consumption.\n\nKey Highlights:\n• ZL102 Aluminium Alloy Casing: Excellent heat dissipation and heavy-duty structural durability.\n• Oil-Free Pure Compressed Air: Completely oil-free operation guarantees zero chemical contamination in water.\n• High Output & High Pressure: Ideal for deep tanks, outdoor ponds, multiple breeding tanks, and hydroponics.\n• Wear-Resistant Piston & Cylinder: Engineered for low friction, low power draw, and extended operational life.\n• Heavy-Duty Vibration Dampening Mounts: Rubber foot mounts minimize noise and surface resonance.\n• Proven Hailea Reliability: Worldwide industry-standard commercial aquarium aeration equipment.",
    specifications: [
      { label: "Brand", value: "Hailea" },
      { label: "Model", value: "ACO-208" },
      { label: "Product Type", value: "Electrical Magnetic Air Compressor" },
      { label: "Category", value: "Air Pumps & Accessories" },
      { label: "Housing Material", value: "ZL102 Aluminium Alloy" },
      { label: "Lubrication", value: "100% Oil-Free Design" },
      { label: "Colour", value: "Silver and Black" },
      { label: "Usage", value: "Multi-Tank Aeration, Breeding Racks & Ponds" },
      { label: "Product Weight", value: "0.950 kg (950 g)" },
      { label: "MRP", value: "₹2,550" },
      { label: "Selling Price", value: "₹2,550" },
      { label: "Stock Quantity", value: "5 Units" },
    ],
    tags: [
      "hailea",
      "aco-208",
      "air compressor",
      "magnetic compressor",
      "commercial air pump",
      "high pressure",
      "aluminium alloy",
      "oil free",
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
        } catch (uploadErr) {
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
  const categoriesToUpdate = ["air-pumps-accessories", "aquarium-decorations"];

  for (const catSlug of categoriesToUpdate) {
    const count = await ProductModel.countDocuments({ category: catSlug });
    await CategoryModel.updateOne({ slug: catSlug }, { $set: { productCount: count } });
    console.log(`   ✅ Category "${catSlug}" productCount updated to ${count}`);
  }

  console.log("\n🎉 All 4 batch-5 products added & synchronized successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
