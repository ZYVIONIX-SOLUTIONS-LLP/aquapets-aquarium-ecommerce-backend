import mongoose from "mongoose";

async function resetOffers() {
  await mongoose.connect("mongodb://127.0.0.1:27017/aqua_pets_aquarium");
  const res = await mongoose.connection.collection("products").updateMany({}, { $set: { isOffer: false } });
  console.log("Matched documents:", res.matchedCount, "Modified documents:", res.modifiedCount);
  await mongoose.disconnect();
}

resetOffers();
