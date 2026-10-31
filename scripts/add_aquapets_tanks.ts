import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

const newTanks = [
  {
    name: "AquaPets Rimless Glass Aquarium (12\"L x 6\"W x 12\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-12x6x12-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Premium 5mm high-clarity rimless glass aquarium with silicone-free clean finishing. Designed for stunning planted layouts, aquascaping, and ornamental fish.",
    fullDescription: "Experience ultra-clear panoramic viewing with the AquaPets Rimless Glass Aquarium. Crafted with premium 5mm high-quality float glass utilizing a cutting-edge silicone-free clean finishing method, this tank delivers an unobstructed, pristine look with crystal-clear edges. Perfect for desktop aquascaping, planted aquariums, nano setups, and vibrant ornamental fish.",
    price: 1299,
    originalPrice: 1699,
    discount: 24,
    rating: 4.9,
    reviewCount: 18,
    images: ["/products/tanks/aquapets-rimless-tank-12x6x12-5mm.jpg"],
    stock: 15,
    badge: "Popular",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 4.8,
    dimensions: { length: 12, breadth: 6, height: 12 },
    tags: ["aquarium", "tank", "rimless tank", "glass tank", "aquapets", "5mm", "planted tank", "aquascaping", "12x6x12"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "12\" x 6\" x 12\" (30.5 x 15.2 x 30.5 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Minimalist" },
      { label: "Capacity", value: "~14.1 Litres (~3.7 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Office / Home Decor" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Rimless Glass Aquarium (18\"L x 9\"W x 12\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-18x9x12-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Premium 5mm high-grade rimless glass aquarium with spacious depth (9\") and silicone-free clean finishing method for lush planted tanks and aquascapes.",
    fullDescription: "Elevate your living or workspace with the AquaPets 18x9x12 Rimless Glass Aquarium. Engineered with 5mm high-quality glass and precision-crafted silicone-free joints, this tank offers expansive 9-inch depth ideal for multi-layer aquascaping rockwork, driftwood, and lush aquatic flora. Enjoy edge-to-edge clarity and a breathtaking underwater panorama.",
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    rating: 5.0,
    reviewCount: 24,
    images: ["/products/tanks/aquapets-rimless-tank-18x9x12-5mm.jpg"],
    stock: 20,
    badge: "Best Seller",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 7.6,
    dimensions: { length: 18, breadth: 9, height: 12 },
    tags: ["aquarium", "tank", "rimless tank", "glass tank", "aquapets", "5mm", "planted aquarium", "aquascaping", "18x9x12"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "18\" x 9\" x 12\" (45.7 x 22.9 x 30.5 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Minimalist" },
      { label: "Capacity", value: "~31.8 Litres (~8.4 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Home Decor, Office Space" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Slim Bookshelf Rimless Glass Aquarium (18\"L x 6\"W x 12\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-18x6x12-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Sleek 18-inch bookshelf style rimless glass aquarium built with 5mm high-quality glass and silicone-free finish. Ideal for narrow consoles and desks.",
    fullDescription: "The AquaPets 18x6x12 Slim Bookshelf Rimless Aquarium is specifically tailored for modern interiors, countertops, and office workspaces. Built with 5mm thick crystal-clear glass, its silicone-free clean jointing provides panoramic viewing in an ultra-sleek narrow footprint. Bring nature home effortlessly without sacrificing table space.",
    price: 1599,
    originalPrice: 2099,
    discount: 24,
    rating: 4.8,
    reviewCount: 15,
    images: ["/products/tanks/aquapets-rimless-tank-18x6x12-5mm.jpg"],
    stock: 18,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Freshwater",
    weightKg: 5.9,
    dimensions: { length: 18, breadth: 6, height: 12 },
    tags: ["aquarium", "tank", "bookshelf tank", "slim tank", "rimless tank", "glass tank", "5mm", "18x6x12"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "18\" x 6\" x 12\" (45.7 x 15.2 x 30.5 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Slim Bookshelf Rimless" },
      { label: "Capacity", value: "~21.2 Litres (~5.6 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Bookshelf / Desk Setup" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Master Rimless Glass Aquarium (24\"L x 12\"W x 18\"H - 6mm)",
    slug: "aquapets-rimless-glass-aquarium-24x12x18-6mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Showstopper 24-inch master rimless aquarium engineered with heavy-duty 6mm high-quality glass and silicone-free joints. Perfect for serious aquascapers.",
    fullDescription: "Transform your room with the AquaPets 24x12x18 Master Rimless Glass Aquarium. Crafted with extra-sturdy 6mm thick glass to withstand high water pressure while maintaining 100% silicone-free invisible seams. Offers an expansive 85-litre water volume ideal for thriving schooling fish, lush Dutch or Iwagumi planted scapes, and exotic aquatic biotopes.",
    price: 3499,
    originalPrice: 4499,
    discount: 22,
    rating: 5.0,
    reviewCount: 32,
    images: ["/products/tanks/aquapets-rimless-tank-24x12x18-6mm.jpg"],
    stock: 12,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 16.5,
    dimensions: { length: 24, breadth: 12, height: 18 },
    tags: ["aquarium", "tank", "master tank", "rimless tank", "glass tank", "6mm", "aquascaping", "24x12x18", "large aquarium"],
    specifications: [
      { label: "Glass Thickness", value: "6mm Heavy-Duty Glass" },
      { label: "Dimensions (L x W x H)", value: "24\" x 12\" x 18\" (61.0 x 30.5 x 45.7 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Masterpiece" },
      { label: "Capacity", value: "~85.0 Litres (~22.5 Gallons)" },
      { label: "Recommended For", value: "Master Aquascaping, Planted Aquarium, Community Fish, Centerpiece Display" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Nano Rimless Desktop Glass Aquarium (8\"L x 4\"W x 6\"H - 5mm)",
    slug: "aquapets-nano-rimless-glass-aquarium-8x4x6-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Compact 8-inch nano desktop rimless glass aquarium with 5mm premium glass and silicone-free finish. Ideal for Betta fish, shrimp, and mini planted scapes.",
    fullDescription: "The AquaPets Nano Rimless Desktop Glass Aquarium brings nature directly to your work desk or bedside table. Featuring 5mm premium thick glass in a compact 8x4x6 inch format, this nano cube offers unmatched aesthetic appeal with crystal-clear silicone-free edges. Ideal for single specimen Betta splendens, Neocaridina shrimp colonies, or moss terrariums.",
    price: 699,
    originalPrice: 999,
    discount: 30,
    rating: 4.9,
    reviewCount: 28,
    images: ["/products/tanks/aquapets-nano-tank-8x4x6-5mm.jpg"],
    stock: 30,
    badge: "Sale",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Nano",
    weightKg: 1.8,
    dimensions: { length: 8, breadth: 4, height: 6 },
    tags: ["aquarium", "tank", "nano tank", "betta tank", "shrimp tank", "desktop aquarium", "5mm", "8x4x6"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "8\" x 4\" x 6\" (20.3 x 10.2 x 15.2 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Ultra-Compact Nano Desktop Rimless" },
      { label: "Capacity", value: "~3.1 Litres (~0.8 Gallon)" },
      { label: "Recommended For", value: "Betta Fish, Dwarf Shrimp, Moss Aquascape, Desk Decor" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  }
];

async function run() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB for adding AquaPets rimless tanks...");

    for (const tank of newTanks) {
      const updated = await Product.findOneAndUpdate(
        { slug: tank.slug },
        { $set: tank },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Upserted product: ${updated.name} (Slug: ${updated.slug})`);
    }

    const totalTanks = await Product.countDocuments({ category: "aquariums-tanks" });
    console.log(`🎉 Done! Total tanks now in database: ${totalTanks}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error adding tank products:", err);
    process.exit(1);
  }
}

run();
