import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

const newBowls = [
  {
    name: "AquaPets Premium Glass Fish Bowl (10\" Diameter x 10\" Height)",
    slug: "aquapets-premium-glass-fish-bowl-10x10",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Medium 10\" crystal-clear glass fish bowl with smooth polished collar and durable design. Ideal for Betta fish, small ornamental fish, and desk decor.",
    fullDescription: "Enhance your workspace or living area with the AquaPets 10x10 Premium Glass Fish Bowl. Featuring clear high-durability blown glass with an elegant rounded silhouette and safe polished rim, this bowl provides 360-degree viewing of your aquatic companions or lush moss scapes. Extremely easy to clean and maintain.",
    price: 599,
    originalPrice: 849,
    discount: 29,
    rating: 4.9,
    reviewCount: 38,
    images: ["/products/tanks/aquapets-premium-fish-bowl-10x10.jpg"],
    stock: 25,
    badge: "Best Seller",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Freshwater",
    weightKg: 2.4,
    dimensions: { length: 10, breadth: 10, height: 10 },
    tags: ["fish bowl", "glass bowl", "round aquarium", "betta bowl", "10 inch bowl", "aquarium", "aquapets"],
    specifications: [
      { label: "Dimensions", value: "10\" Diameter x 10\" Height (25.4 x 25.4 cm)" },
      { label: "Material", value: "Clear High-Quality Blown Glass" },
      { label: "Finish", value: "Smooth & Premium Polished Collar Rim" },
      { label: "Design Style", value: "Elegant Round 360° Panoramic Design" },
      { label: "Capacity", value: "~8.5 Litres (~2.2 Gallons)" },
      { label: "Recommended For", value: "Betta Fish, Goldfish, Small Fish, Plants, Home & Office Decor, Gifting" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Premium Glass Fish Bowl (8\" Diameter x 8\" Height)",
    slug: "aquapets-premium-glass-fish-bowl-8x8",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Compact 8\" decorative glass fish bowl with crystal-clear optics and heavy base. Ideal for Betta splendens, shrimp, or aquatic tabletop arrangements.",
    fullDescription: "The AquaPets 8x8 Premium Glass Fish Bowl brings graceful simplicity to any desk, bookshelf, or tabletop. Made from strong, durable, crystal-clear glass with a neat collar finish, it is a favourite for single Betta setups, micro aquatic terrariums, or gifting.",
    price: 449,
    originalPrice: 649,
    discount: 30,
    rating: 4.8,
    reviewCount: 29,
    images: ["/products/tanks/aquapets-premium-fish-bowl-8x8.jpg"],
    stock: 30,
    badge: "Popular",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Freshwater",
    weightKg: 1.6,
    dimensions: { length: 8, breadth: 8, height: 8 },
    tags: ["fish bowl", "glass bowl", "round aquarium", "betta bowl", "8 inch bowl", "aquarium", "aquapets"],
    specifications: [
      { label: "Dimensions", value: "8\" Diameter x 8\" Height (20.3 x 20.3 cm)" },
      { label: "Material", value: "Clear High-Quality Blown Glass" },
      { label: "Finish", value: "Smooth & Premium Polished Collar Rim" },
      { label: "Design Style", value: "Elegant Round 360° Panoramic Design" },
      { label: "Capacity", value: "~4.2 Litres (~1.1 Gallons)" },
      { label: "Recommended For", value: "Betta Fish, Dwarf Shrimp, Moss Balls, Tabletop Decor, Gifting" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Premium Glass Fish Bowl (6\" Diameter x 6\" Height)",
    slug: "aquapets-premium-glass-fish-bowl-6x6",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Small 6\" tabletop glass fish bowl with crystal clarity. Perfect for Marimo moss balls, small aquatic plants, desk decoration, or gifting.",
    fullDescription: "Crafted with precision-blown clear glass, the AquaPets 6x6 Glass Fish Bowl is a delightful decorative accent for any interior. Its smooth-edged opening makes feeding and water changes effortless. Excellent for mini aquatic plants, floating flora, moss terrariums, or decorative centerpieces.",
    price: 299,
    originalPrice: 449,
    discount: 33,
    rating: 4.7,
    reviewCount: 22,
    images: ["/products/tanks/aquapets-premium-fish-bowl-6x6.jpg"],
    stock: 40,
    badge: "Sale",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Freshwater",
    weightKg: 0.9,
    dimensions: { length: 6, breadth: 6, height: 6 },
    tags: ["fish bowl", "glass bowl", "round aquarium", "mini bowl", "6 inch bowl", "moss terrarium", "aquapets"],
    specifications: [
      { label: "Dimensions", value: "6\" Diameter x 6\" Height (15.2 x 15.2 cm)" },
      { label: "Material", value: "Clear High-Quality Blown Glass" },
      { label: "Finish", value: "Smooth & Premium Polished Collar Rim" },
      { label: "Design Style", value: "Compact Round 360° Panoramic Design" },
      { label: "Capacity", value: "~1.8 Litres (~0.48 Gallon)" },
      { label: "Recommended For", value: "Small Aquatic Plants, Marimo Moss Balls, Desk Decor, Gifting" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  },
  {
    name: "AquaPets Mini Glass Fish Bowl (4\" Diameter x 4\" Height)",
    slug: "aquapets-premium-glass-fish-bowl-4x4",
    brand: "AquaPets Aquarium",
    category: "aquariums-tanks",
    description: "Miniature 4\" clear glass bowl designed for desktop decor, succulent terrariums, moss balls, or elegant gifting.",
    fullDescription: "The AquaPets 4x4 Mini Glass Bowl is an ultra-cute, high-clarity decorative glass sphere. Built with thick durable glass and a rounded mouth, it fits anywhere — from office cubicles to bedside tables. Ideal for aquatic mosses, decorative pebbles, mini succulents, and personalized gifts.",
    price: 199,
    originalPrice: 299,
    discount: 33,
    rating: 4.8,
    reviewCount: 19,
    images: ["/products/tanks/aquapets-premium-fish-bowl-4x4.jpg"],
    stock: 50,
    badge: "New",
    isFeatured: true,
    isStarterKit: false,
    isOffer: false,
    tankType: "Nano",
    weightKg: 0.5,
    dimensions: { length: 4, breadth: 4, height: 4 },
    tags: ["mini fish bowl", "glass bowl", "nano bowl", "4 inch bowl", "desk decor", "succulent bowl", "aquapets"],
    specifications: [
      { label: "Dimensions", value: "4\" Diameter x 4\" Height (10.2 x 10.2 cm)" },
      { label: "Material", value: "Clear High-Quality Blown Glass" },
      { label: "Finish", value: "Smooth & Premium Polished Collar Rim" },
      { label: "Design Style", value: "Mini Round Sphere Design" },
      { label: "Capacity", value: "~0.6 Litre (~0.16 Gallon)" },
      { label: "Recommended For", value: "Moss Terrarium, Air Plants, Desk Decor, Gifting Option" },
      { label: "Brand", value: "AquaPets Aquarium" }
    ]
  }
];

async function run() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB for adding AquaPets Fish Bowls...");

    for (const bowl of newBowls) {
      const updated = await Product.findOneAndUpdate(
        { slug: bowl.slug },
        { $set: bowl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Upserted product: ${updated.name} (Slug: ${updated.slug})`);
    }

    const totalTanks = await Product.countDocuments({ category: "aquariums-tanks" });
    console.log(`🎉 Done! Total tanks now in database: ${totalTanks}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error adding fish bowls:", err);
    process.exit(1);
  }
}

run();
