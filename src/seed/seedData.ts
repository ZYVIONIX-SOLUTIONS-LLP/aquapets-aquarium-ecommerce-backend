import mongoose from "mongoose";
import { config } from "../config/env.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { User } from "../models/User.js";
import { DEFAULT_CATEGORIES } from "../controllers/categoryController.js";

const seedDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB for seeding...");

    // Seed All 20 Categories
    await Category.deleteMany({});
    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} Categories in Database`);

    // Keep existing products added via Admin Panel (Do not clear)
    const existingProductsCount = await Product.countDocuments();
    console.log(`📦 Database contains ${existingProductsCount} existing product(s). Preserving products.`);

    // Seed Demo Admin User
    await User.deleteMany({ email: "admin@aquapets.com" });
    await User.create({
      name: "AquaPets Admin",
      email: "admin@aquapets.com",
      password: "AdminPassword123!",
      role: "admin",
      phone: "+91 9876543210",
      addresses: [
        {
          fullName: "AquaPets HQ",
          email: "admin@aquapets.com",
          phone: "+91 9876543210",
          houseBuilding: "Plot 42, Aquarium Hub",
          street: "Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          isDefault: true,
        },
      ],
    });
    console.log("✅ Admin user seeded (admin@aquapets.com / AdminPassword123!)");

    // Seed Demo Customer User
    await User.deleteMany({ email: "melvin12345@gmail.com" });
    await User.create({
      name: "melvin12345",
      email: "melvin12345@gmail.com",
      password: "Password123!",
      role: "customer",
      phone: "916238392582",
      addresses: [
        {
          fullName: "melvin",
          email: "melvin12345@gmail.com",
          phone: "916238392582",
          houseBuilding: "room17, kaithakkepadavil (H)",
          street: "Akkarappadam P.O , Vaikom , Kottayam",
          city: "Vaikom",
          state: "Kerala",
          pincode: "686143",
          isDefault: true,
        },
      ],
    });
    console.log("✅ Demo customer user seeded (melvin12345@gmail.com / Password123!)");

    console.log("🌟 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
