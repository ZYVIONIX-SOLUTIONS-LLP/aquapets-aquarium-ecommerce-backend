import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { MongoClient } from "mongodb";

const LOCAL_URI = "mongodb://127.0.0.1:27017/aqua_pets_aquarium";
const ATLAS_URI = "process.env.MONGO_URI || "mongodb://localhost:27017/aqua_pets"";

async function migrate() {
  console.log("Connecting to Local MongoDB...");
  const localClient = await MongoClient.connect(LOCAL_URI);
  const localDb = localClient.db("aqua_pets_aquarium");

  console.log("Connecting to MongoDB Atlas...");
  const atlasClient = await MongoClient.connect(ATLAS_URI);
  const atlasDb = atlasClient.db("aqua_pets_aquarium");

  const collections = await localDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in local database.\n`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const localCollection = localDb.collection(collName);
    const atlasCollection = atlasDb.collection(collName);

    const docs = await localCollection.find({}).toArray();
    console.log(`📦 Collection '${collName}': ${docs.length} documents found locally.`);

    if (docs.length > 0) {
      // Clear atlas collection first to avoid duplicates
      await atlasCollection.deleteMany({});
      await atlasCollection.insertMany(docs);
      console.log(`   ✅ Synced ${docs.length} documents to Atlas '${collName}'.`);
    }
  }

  console.log("\n🎉 Migration to MongoDB Atlas completed successfully!");

  // Verification
  console.log("\n📊 Atlas Database Verification:");
  const atlasColls = await atlasDb.listCollections().toArray();
  for (const coll of atlasColls) {
    const count = await atlasDb.collection(coll.name).countDocuments();
    console.log(` - ${coll.name}: ${count} documents`);
  }

  await localClient.close();
  await atlasClient.close();
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
