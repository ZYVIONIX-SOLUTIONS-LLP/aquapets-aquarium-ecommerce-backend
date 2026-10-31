import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

const LOCAL_URI = "mongodb://127.0.0.1:27017/aqua_pets_aquarium";
const ATLAS_URI = "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

async function migrate() {
  console.log("Connecting to Local MongoDB...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log("✅ Local MongoDB connected.");

  console.log("Connecting to Atlas MongoDB...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log("✅ Atlas MongoDB connected.");

  const collections = await localConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in local database.\n`);

  for (const col of collections) {
    const colName = col.name;
    const localCollection = localConn.db.collection(colName);
    const atlasCollection = atlasConn.db.collection(colName);

    const docs = await localCollection.find({}).toArray();
    console.log(`Migrating '${colName}' (${docs.length} documents)...`);

    if (docs.length > 0) {
      // Clear target collection first
      await atlasCollection.deleteMany({});
      // Insert in chunks
      const chunkSize = 100;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        await atlasCollection.insertMany(chunk);
      }
      console.log(`  -> Successfully transferred ${docs.length} documents into Atlas '${colName}'.`);
    } else {
      console.log(`  -> 0 documents to transfer.`);
    }
  }

  console.log("\nVerifying Atlas document counts:");
  const atlasCols = await atlasConn.db.listCollections().toArray();
  for (const col of atlasCols) {
    const count = await atlasConn.db.collection(col.name).countDocuments();
    console.log(` - ${col.name}: ${count}`);
  }

  await localConn.close();
  await atlasConn.close();
  console.log("\n🎉 Migration to MongoDB Atlas completed successfully!");
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
