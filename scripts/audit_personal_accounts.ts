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

const MONGO_URI = process.env.MONGODB_URI || "";

async function auditDatabase() {
  console.log("🔍 Scanning MongoDB Atlas database for any personal/testing accounts...\n");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("DB connection failed");
    return;
  }

  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const colName = col.name;
    const allDocs = await db.collection(colName).find({}).toArray();
    const matches: any[] = [];

    for (const doc of allDocs) {
      const docStr = JSON.stringify(doc).toLowerCase();
      if (docStr.includes("akshith") || docStr.includes("jeevan")) {
        matches.push(doc);
      }
    }

    if (matches.length > 0) {
      console.log(`📌 Found in collection [${colName}] (${matches.length} matches):`);
      matches.forEach((m) => {
        console.log(`   - ID: ${m._id}`);
        if (m.email) console.log(`     Email: ${m.email}`);
        if (m.name) console.log(`     Name: ${m.name}`);
        if (m.shippingAddress) {
          console.log(`     Shipping Name: ${m.shippingAddress.fullName}, Phone: ${m.shippingAddress.phone}`);
        }
      });
      console.log("");
    }
  }

  // Also print all users
  const users = await db.collection("users").find({}).toArray();
  console.log(`👥 Complete list of all registered Users in MongoDB (${users.length}):`);
  users.forEach((u) => {
    console.log(`   - [${u.role || "customer"}] ${u.name} <${u.email}> (ID: ${u._id})`);
  });

  // Also print all subscribers
  const subs = await db.collection("subscribers").find({}).toArray();
  console.log(`\n📬 Complete list of all Newsletter Subscribers (${subs.length}):`);
  subs.forEach((s) => {
    console.log(`   - ${s.email} (Subscribed: ${s.isSubscribed})`);
  });

  // Also print all orders
  const orders = await db.collection("orders").find({}).toArray();
  console.log(`\n📦 Complete list of all Orders (${orders.length}):`);
  orders.forEach((o) => {
    console.log(
      `   - Order #${o.orderNumber || o._id}: ${o.shippingAddress?.fullName} <${o.shippingAddress?.email || "no-email"}> Phone: ${o.shippingAddress?.phone} Total: ₹${o.total}`
    );
  });

  await mongoose.disconnect();
}

auditDatabase().catch(console.error);
