import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

async function keepOnlyAquariumTanks() {
  await mongoose.connect(config.mongodbUri);
  console.log("Connected to MongoDB database...");

  const totalBefore = await Product.countDocuments();
  const tanksBefore = await Product.countDocuments({ category: "aquariums-tanks" });
  console.log(`Current Total Products: ${totalBefore}`);
  console.log(`Aquariums & Tanks Products to keep: ${tanksBefore}`);

  // Delete all products except those in 'aquariums-tanks'
  const deleteResult = await Product.deleteMany({
    category: { $ne: "aquariums-tanks" },
  });

  console.log(`\n🗑️ Deleted ${deleteResult.deletedCount} products from other categories.`);

  const remainingTotal = await Product.countDocuments();
  const remainingTanks = await Product.countDocuments({ category: "aquariums-tanks" });
  console.log(`\n✅ Verification:`);
  console.log(`- Remaining Total Products: ${remainingTotal}`);
  console.log(`- Remaining in "aquariums-tanks": ${remainingTanks}`);

  const distinctRemainingCategories = await Product.distinct("category");
  console.log(`- Distinct Categories Present in Products:`, distinctRemainingCategories);

  await mongoose.disconnect();
}

keepOnlyAquariumTanks().catch((err) => {
  console.error("Error executing product removal:", err);
  process.exit(1);
});
