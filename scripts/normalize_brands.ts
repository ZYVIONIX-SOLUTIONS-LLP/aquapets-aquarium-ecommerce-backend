import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGODB_URI ||
  "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

async function normalizeBrands() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  const collection = mongoose.connection.db.collection("products");

  const sunsunRes = await collection.updateMany(
    { brand: { $regex: /^sunsun$/i } },
    { $set: { brand: "SunSun" } }
  );
  console.log(`Updated SunSun products: ${sunsunRes.modifiedCount}`);

  const bluepetRes = await collection.updateMany(
    { brand: { $regex: /^bluepet$/i } },
    { $set: { brand: "Bluepet" } }
  );
  console.log(`Updated Bluepet products: ${bluepetRes.modifiedCount}`);

  const rsRes = await collection.updateMany(
    { brand: { $regex: /^rs\s*electrical$/i } },
    { $set: { brand: "RS Electrical" } }
  );
  console.log(`Updated RS Electrical products: ${rsRes.modifiedCount}`);

  const haileaRes = await collection.updateMany(
    { brand: { $regex: /^hailea$/i } },
    { $set: { brand: "Hailea" } }
  );
  console.log(`Updated Hailea products: ${haileaRes.modifiedCount}`);

  const distinctBrands = await collection.distinct("brand");
  console.log("Distinct brands now in DB:", distinctBrands);

  await mongoose.disconnect();
  console.log("Done.");
}

normalizeBrands().catch(console.error);

