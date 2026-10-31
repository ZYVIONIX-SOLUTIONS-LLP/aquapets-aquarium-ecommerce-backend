import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

const newProducts = [
  {
    name: "AquaPets Rimless Glass Aquarium (12\"L x 4\"W x 8\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-12x4x8-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Compact 12-inch shallow rimless glass aquarium with 5mm premium glass and silicone-free finish. Ideal for nano aquascaping and desktops.",
    fullDescription: "The AquaPets 12x4x8 Rimless Glass Aquarium delivers stunning edge-to-edge optical clarity in a slim, elegant footprint. Built with 5mm high-grade float glass using our signature silicone-free clean finishing technique, it offers an unobstructed, crystal-clear panorama ideal for desktop planted scapes, shrimp colonies, and delicate aquascaping layouts.",
    price: 899,
    originalPrice: 1199,
    discount: 25,
    rating: 4.9,
    reviewCount: 16,
    images: ["/products/tanks/aquapets-rimless-tank-12x4x8-5mm.jpg"],
    stock: 20,
    badge: "Popular",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 3.2,
    dimensions: { length: 12, breadth: 4, height: 8 },
    tags: ["aquarium", "tank", "rimless tank", "glass tank", "aquapets", "5mm", "nano tank", "desktop aquarium", "12x4x8"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "12\" x 4\" x 8\" (30.5 x 10.2 x 20.3 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Minimalist" },
      { label: "Capacity", value: "~6.3 Litres (~1.65 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Home Decor, Office Space" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Rimless Glass Aquarium (12\"L x 6\"W x 9\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-12x6x9-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Versatile 12-inch rimless glass tank featuring 5mm high-clarity glass and silicone-free seams. Perfect for small desktop planted scapes.",
    fullDescription: "Experience superior aquatic aesthetics with the AquaPets 12x6x9 Rimless Glass Aquarium. Engineered with 5mm premium crystal-clear glass and seamless silicone-free edges, this proportional tank offers generous depth for hardscape rocks and background stem plants while keeping a compact, stylish profile.",
    price: 1099,
    originalPrice: 1499,
    discount: 27,
    rating: 4.8,
    reviewCount: 20,
    images: ["/products/tanks/aquapets-rimless-tank-12x6x9-5mm.jpg"],
    stock: 18,
    badge: "Sale",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 4.2,
    dimensions: { length: 12, breadth: 6, height: 9 },
    tags: ["aquarium", "tank", "rimless tank", "glass tank", "aquapets", "5mm", "planted tank", "12x6x9"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "12\" x 6\" x 9\" (30.5 x 15.2 x 22.9 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Minimalist" },
      { label: "Capacity", value: "~10.6 Litres (~2.8 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Home Decor, Office Space" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Wide View Rimless Glass Aquarium (18\"L x 12\"W x 12\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-18x12x12-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Expansive 18-inch wide depth (12\") rimless glass aquarium with 5mm thick glass and invisible joints. Superior depth for dramatic aquascapes.",
    fullDescription: "Take your aquascaping to professional heights with the AquaPets 18x12x12 Wide View Rimless Glass Aquarium. Featuring an extra-deep 12-inch footprint, this 42.5-litre tank gives aquascapers unmatched creative freedom for creating front-to-back depth, elaborate hardscapes, and thriving Dutch or nature aquariums.",
    price: 2199,
    originalPrice: 2799,
    discount: 21,
    rating: 5.0,
    reviewCount: 35,
    images: ["/products/tanks/aquapets-rimless-tank-18x12x12-5mm.jpg"],
    stock: 15,
    badge: "Best Seller",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 9.8,
    dimensions: { length: 18, breadth: 12, height: 12 },
    tags: ["aquarium", "tank", "wide rimless tank", "glass tank", "aquapets", "5mm", "aquascaping", "18x12x12"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "18\" x 12\" x 12\" (45.7 x 30.5 x 30.5 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Wide-Depth Rimless Minimalist" },
      { label: "Capacity", value: "~42.5 Litres (~11.2 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Home Decor, Office Space" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Rimless Glass Aquarium (16\"L x 8\"W x 12\"H - 5mm)",
    slug: "aquapets-rimless-glass-aquarium-16x8x12-5mm",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Well-balanced 16-inch rimless aquarium crafted with 5mm premium glass and silicone-free seams. Excellent volume-to-space ratio.",
    fullDescription: "The AquaPets 16x8x12 Rimless Glass Aquarium is the golden ratio choice for modern home and office aquarists. Combining a 16-inch panoramic viewing panel with an 8-inch depth and 12-inch height, it provides 25 litres of crystal-clear swimming volume with neat silicone-free joints that seamlessly integrate into any room.",
    price: 1699,
    originalPrice: 2199,
    discount: 23,
    rating: 4.9,
    reviewCount: 22,
    images: ["/products/tanks/aquapets-rimless-tank-16x8x12-5mm.jpg"],
    stock: 22,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Planted Tank",
    weightKg: 6.8,
    dimensions: { length: 16, breadth: 8, height: 12 },
    tags: ["aquarium", "tank", "rimless tank", "glass tank", "aquapets", "5mm", "16x8x12", "planted tank"],
    specifications: [
      { label: "Glass Thickness", value: "5mm High-Quality Glass" },
      { label: "Dimensions (L x W x H)", value: "16\" x 8\" x 12\" (40.6 x 20.3 x 30.5 cm)" },
      { label: "Finishing Method", value: "Silicone-Free Clean Finishing Method" },
      { label: "Design Style", value: "Rimless & Modern Minimalist" },
      { label: "Capacity", value: "~25.2 Litres (~6.65 Gallons)" },
      { label: "Recommended For", value: "Ornamental Fish, Planted Aquarium, Aquascaping, Home Decor, Office Space" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Premium Glass Fish Bowl (12\" Diameter x 12\" Height)",
    slug: "aquapets-premium-glass-fish-bowl-12x12",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Classic 12\" round glass fish bowl with ultra-clear heavy glass, smooth finished rim, and 360-degree panoramic viewing. Ideal for Betta and Goldfish.",
    fullDescription: "Bring timeless charm into your home or office with the AquaPets 12x12 Premium Glass Fish Bowl. Manufactured with crystal-clear high-durability blown glass with a smooth polished collar rim, this bowl delivers 360-degree panoramic viewing. Easy to clean and maintain, it makes a breathtaking centerpiece for Betta fish, fancy goldfish, live aquatic plants, table decorations, or gifting.",
    price: 799,
    originalPrice: 1099,
    discount: 27,
    rating: 4.8,
    reviewCount: 42,
    images: ["/products/tanks/aquapets-premium-fish-bowl-12x12.jpg"],
    stock: 35,
    badge: "Top Pick",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Freshwater",
    weightKg: 3.5,
    dimensions: { length: 12, breadth: 12, height: 12 },
    tags: ["fish bowl", "glass bowl", "round aquarium", "betta bowl", "goldfish bowl", "12 inch bowl", "aquarium", "aquapets"],
    specifications: [
      { label: "Dimensions", value: "12\" Diameter x 12\" Height (30.5 x 30.5 cm)" },
      { label: "Material", value: "Clear High-Quality Blown Glass" },
      { label: "Finish", value: "Smooth & Premium Polished Collar Rim" },
      { label: "Design Style", value: "Elegant Round 360° Panoramic Design" },
      { label: "Capacity", value: "~15.0 Litres (~4.0 Gallons)" },
      { label: "Recommended For", value: "Small Fish, Betta, Goldfish, Aquatic Plants, Home Decor, Office Space, Gifting" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  }
];

async function run() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB for adding AquaPets batch 2 products...");

    for (const item of newProducts) {
      const updated = await Product.findOneAndUpdate(
        { slug: item.slug },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Upserted product: ${updated.name} (Slug: ${updated.slug})`);
    }

    const totalTanks = await Product.countDocuments({ category: "aquariums-tanks" });
    console.log(`🎉 Done! Total tanks now in database: ${totalTanks}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error adding products:", err);
    process.exit(1);
  }
}

run();
