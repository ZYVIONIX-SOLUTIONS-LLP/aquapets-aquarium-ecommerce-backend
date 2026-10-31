import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { Product } from "../src/models/Product.js";

export function determineMockWeightAndDimensions(name: string, category: string) {
  const n = (name || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  let weightKg = 0.5;
  let dimensions = { length: 15, breadth: 10, height: 8 };

  if (cat === "aquariums-tanks" || cat === "tanks" || (cat.includes("tank") && !cat.includes("co2") && !cat.includes("planted-tank"))) {
    if (n.includes("48\"") || n.includes("48 inch") || n.includes("large")) {
      weightKg = 32.0;
      dimensions = { length: 122, breadth: 30, height: 45 };
    } else if (n.includes("36\"") && n.includes("18\"")) {
      weightKg = 22.0;
      dimensions = { length: 91, breadth: 30, height: 45 };
    } else if (n.includes("36\"")) {
      weightKg = 16.0;
      dimensions = { length: 91, breadth: 30, height: 30 };
    } else if (n.includes("rimless") || n.includes("planted") || n.includes("marine")) {
      weightKg = 10.5;
      dimensions = { length: 60, breadth: 30, height: 36 };
    } else if (n.includes("nano")) {
      weightKg = 4.2;
      dimensions = { length: 30, breadth: 30, height: 30 };
    } else if (n.includes("bowl")) {
      if (n.includes("12\"")) { weightKg = 3.5; dimensions = { length: 30, breadth: 30, height: 28 }; }
      else if (n.includes("10\"")) { weightKg = 2.8; dimensions = { length: 25, breadth: 25, height: 24 }; }
      else if (n.includes("8\"")) { weightKg = 2.0; dimensions = { length: 20, breadth: 20, height: 20 }; }
      else if (n.includes("6\"")) { weightKg = 1.4; dimensions = { length: 16, breadth: 16, height: 16 }; }
      else { weightKg = 0.9; dimensions = { length: 12, breadth: 12, height: 12 }; }
    } else {
      weightKg = 8.0;
      dimensions = { length: 45, breadth: 28, height: 30 };
    }
  } else if (cat.includes("gravel") || cat.includes("sand")) {
    if (n.includes("soil") || n.includes("aquasoil")) {
      weightKg = 4.0;
      dimensions = { length: 32, breadth: 22, height: 10 };
    } else if (n.includes("coarse") || n.includes("natural") || n.includes("river")) {
      weightKg = 5.0;
      dimensions = { length: 35, breadth: 25, height: 12 };
    } else if (n.includes("fine") || n.includes("black") || n.includes("white")) {
      weightKg = 2.5;
      dimensions = { length: 26, breadth: 18, height: 8 };
    } else {
      weightKg = 3.0;
      dimensions = { length: 28, breadth: 20, height: 10 };
    }
  } else if (cat.includes("driftwood") || cat.includes("rocks")) {
    if (n.includes("large")) {
      weightKg = 4.5;
      dimensions = { length: 45, breadth: 25, height: 20 };
    } else if (n.includes("rock") || n.includes("stone") || n.includes("mopani")) {
      weightKg = 2.8;
      dimensions = { length: 28, breadth: 20, height: 18 };
    } else if (n.includes("spider") || n.includes("manzanita")) {
      weightKg = 1.5;
      dimensions = { length: 35, breadth: 22, height: 18 };
    } else if (n.includes("small") || n.includes("cholla")) {
      weightKg = 0.45;
      dimensions = { length: 18, breadth: 10, height: 8 };
    } else {
      weightKg = 1.8;
      dimensions = { length: 25, breadth: 18, height: 15 };
    }
  } else if (cat.includes("filter-media")) {
    if (n.includes("wool") || n.includes("sponge")) {
      weightKg = 0.25;
      dimensions = { length: 25, breadth: 18, height: 8 };
    } else {
      weightKg = 0.95;
      dimensions = { length: 20, breadth: 15, height: 10 };
    }
  } else if (cat.includes("filter")) {
    if (n.includes("canister")) {
      weightKg = 4.8;
      dimensions = { length: 35, breadth: 28, height: 42 };
    } else if (n.includes("6000") || n.includes("6001") || n.includes("large")) {
      weightKg = 1.6;
      dimensions = { length: 22, breadth: 14, height: 32 };
    } else if (n.includes("1402") || n.includes("1403") || n.includes("1802")) {
      weightKg = 1.1;
      dimensions = { length: 18, breadth: 12, height: 26 };
    } else if (n.includes("sponge")) {
      weightKg = 0.25;
      dimensions = { length: 12, breadth: 12, height: 18 };
    } else if (n.includes("200f") || n.includes("300f") || n.includes("400f")) {
      weightKg = 0.55;
      dimensions = { length: 14, breadth: 9, height: 20 };
    } else {
      weightKg = 0.75;
      dimensions = { length: 16, breadth: 10, height: 22 };
    }
  } else if (cat.includes("water-pumps") || cat.includes("circulation")) {
    if (n.includes("6000") || n.includes("5000")) {
      weightKg = 1.65;
      dimensions = { length: 20, breadth: 14, height: 16 };
    } else if (n.includes("4000") || n.includes("3000")) {
      weightKg = 1.15;
      dimensions = { length: 18, breadth: 12, height: 14 };
    } else if (n.includes("wave maker")) {
      weightKg = 0.65;
      dimensions = { length: 15, breadth: 10, height: 10 };
    } else {
      weightKg = 0.85;
      dimensions = { length: 16, breadth: 11, height: 13 };
    }
  } else if (cat.includes("air-pumps")) {
    if (n.includes("six") || n.includes("four")) {
      weightKg = 0.95;
      dimensions = { length: 22, breadth: 16, height: 12 };
    } else if (n.includes("double")) {
      weightKg = 0.65;
      dimensions = { length: 18, breadth: 12, height: 10 };
    } else if (n.includes("pipe") || n.includes("tube") || n.includes("stone") || n.includes("valve")) {
      weightKg = 0.12;
      dimensions = { length: 10, breadth: 8, height: 4 };
    } else {
      weightKg = 0.42;
      dimensions = { length: 15, breadth: 10, height: 8 };
    }
  } else if (cat.includes("light")) {
    if (n.includes("marine") || n.includes("plant") || n.includes("rgb")) {
      weightKg = 1.1;
      dimensions = { length: 50, breadth: 12, height: 6 };
    } else if (n.includes("clip") || n.includes("nano")) {
      weightKg = 0.38;
      dimensions = { length: 22, breadth: 10, height: 5 };
    } else {
      weightKg = 0.75;
      dimensions = { length: 40, breadth: 10, height: 6 };
    }
  } else if (cat.includes("heater")) {
    if (n.includes("titanium") || n.includes("stainless")) {
      weightKg = 0.48;
      dimensions = { length: 32, breadth: 6, height: 6 };
    } else if (n.includes("thermometer")) {
      weightKg = 0.08;
      dimensions = { length: 15, breadth: 4, height: 3 };
    } else {
      weightKg = 0.35;
      dimensions = { length: 28, breadth: 5, height: 5 };
    }
  } else if (cat.includes("food")) {
    if (n.includes("pellets") || n.includes("sticks")) {
      weightKg = 0.45;
      dimensions = { length: 12, breadth: 12, height: 16 };
    } else if (n.includes("flake")) {
      weightKg = 0.22;
      dimensions = { length: 10, breadth: 10, height: 14 };
    } else {
      weightKg = 0.30;
      dimensions = { length: 11, breadth: 11, height: 15 };
    }
  } else if (cat.includes("water-care") || cat.includes("medicine")) {
    weightKg = 0.35; // ~250ml - 300ml bottle
    dimensions = { length: 8, breadth: 8, height: 18 };
  } else if (cat.includes("co2")) {
    if (n.includes("cylinder")) {
      weightKg = 4.2;
      dimensions = { length: 42, breadth: 14, height: 14 };
    } else if (n.includes("regulator")) {
      weightKg = 0.85;
      dimensions = { length: 18, breadth: 14, height: 10 };
    } else {
      weightKg = 0.15;
      dimensions = { length: 12, breadth: 8, height: 6 };
    }
  } else if (cat.includes("plant")) {
    weightKg = cat.includes("artificial") ? 0.18 : 0.10;
    dimensions = { length: 15, breadth: 10, height: 8 };
  } else if (cat.includes("cleaning")) {
    if (n.includes("siphon") || n.includes("cleaner") || n.includes("gravel")) {
      weightKg = 0.45;
      dimensions = { length: 35, breadth: 12, height: 8 };
    } else if (n.includes("net")) {
      weightKg = 0.12;
      dimensions = { length: 28, breadth: 10, height: 4 };
    } else {
      weightKg = 0.28;
      dimensions = { length: 20, breadth: 10, height: 6 };
    }
  } else if (cat.includes("feeding-breeding")) {
    if (n.includes("automatic") || n.includes("feeder")) {
      weightKg = 0.38;
      dimensions = { length: 16, breadth: 12, height: 12 };
    } else if (n.includes("box") || n.includes("trap") || n.includes("incubator") || n.includes("hatchery")) {
      weightKg = 0.28;
      dimensions = { length: 18, breadth: 12, height: 12 };
    } else if (n.includes("net") || n.includes("mop") || n.includes("pipette") || n.includes("spoon") || n.includes("dish")) {
      weightKg = 0.10;
      dimensions = { length: 14, breadth: 8, height: 5 };
    } else {
      weightKg = 0.18;
      dimensions = { length: 15, breadth: 10, height: 6 };
    }
  } else if (cat.includes("tool")) {
    weightKg = 0.22;
    dimensions = { length: 28, breadth: 6, height: 3 };
  } else if (cat.includes("decorat")) {
    if (n.includes("castle") || n.includes("rock") || n.includes("house")) {
      weightKg = 0.85;
      dimensions = { length: 20, breadth: 16, height: 18 };
    } else {
      weightKg = 0.45;
      dimensions = { length: 15, breadth: 12, height: 12 };
    }
  } else if (cat.includes("spare")) {
    if (n.includes("extension") || n.includes("power strip")) {
      weightKg = 0.48;
      dimensions = { length: 28, breadth: 8, height: 6 };
    } else if (n.includes("timer")) {
      weightKg = 0.24;
      dimensions = { length: 12, breadth: 8, height: 8 };
    } else {
      weightKg = 0.12;
      dimensions = { length: 10, breadth: 8, height: 5 };
    }
  }

  return { weightKg: Math.round(weightKg * 100) / 100, dimensions };
}

async function run() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB:", config.mongodbUri);

    const products = await Product.find({});
    console.log(`Found ${products.length} products to update...`);

    let updatedCount = 0;
    const bulkOps = [];

    for (const p of products) {
      const { weightKg, dimensions } = determineMockWeightAndDimensions(p.name, p.category);
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              weightKg,
              dimensions,
            },
          },
        },
      });
      updatedCount++;
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    console.log(`✅ Successfully updated mock weight and dimensions for ${updatedCount} products!`);

    // Sample check
    const samples = await Product.find({}, { name: 1, category: 1, weightKg: 1, dimensions: 1 }).limit(10);
    console.log("Sample updated products:", JSON.stringify(samples, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Update failed:", error);
    process.exit(1);
  }
}

run();
