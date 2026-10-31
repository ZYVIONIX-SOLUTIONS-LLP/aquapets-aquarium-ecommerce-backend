import axios from "axios";
import jwt from "jsonwebtoken";

const API_BASE = "http://127.0.0.1:5000/api";
const JWT_SECRET = "aqua_pets_super_secret_jwt_key_2026";
const ADMIN_ID = "6ac0928214038a956245f5bc";

const adminToken = jwt.sign({ id: ADMIN_ID }, JWT_SECRET, { expiresIn: "1h" });
const adminHeaders = {
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
};

interface TestResult {
  suite: string;
  test: string;
  status: "PASS" | "FAIL";
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<string | void>) {
  const start = Date.now();
  try {
    const detail = await fn();
    const duration = Date.now() - start;
    results.push({ suite, test: name, status: "PASS", details: detail || "OK", durationMs: duration });
    console.log(`  ✅ [PASS] ${name} (${duration}ms) ${detail ? "-> " + detail : ""}`);
  } catch (err: any) {
    const duration = Date.now() - start;
    const msg = err.response?.data?.message || err.message || "Unknown error";
    results.push({ suite, test: name, status: "FAIL", details: msg, durationMs: duration });
    console.error(`  ❌ [FAIL] ${name} (${duration}ms) -> ${msg}`);
  }
}

async function main() {
  console.log("==================================================================");
  console.log("🚀 DEEP API TEST: Shipping & Logistics Admin Page (All Endpoints)");
  console.log("   Target: http://127.0.0.1:5000/api");
  console.log("==================================================================\n");

  // SUITE 1: GET /api/orders (Used by page mount & live transit queue)
  console.log("📦 SUITE 1: Orders Query API (Page Hydration & Queue)");
  let sampleOrderNumber = "";
  let sampleOrderId = "";

  await runTest("Orders Query", "GET /api/orders returns active orders with valid structure", async () => {
    const res = await axios.get(`${API_BASE}/orders`, adminHeaders);
    if (!res.data.success || !Array.isArray(res.data.data)) {
      throw new Error("Invalid response format from /api/orders");
    }
    const orders = res.data.data;
    if (orders.length === 0) throw new Error("No orders found in database");

    const first = orders[0];
    sampleOrderNumber = first.orderNumber;
    sampleOrderId = first._id;

    const inTransit = orders.filter((o: any) => o.orderStatus === "Out for Delivery" || o.orderStatus === "Packed").length;
    return `Fetched ${orders.length} orders total. Current in-transit: ${inTransit}. Target sample order: ${sampleOrderNumber}`;
  });

  // SUITE 2: POST /api/shipping/serviceability (Pincode & Fare Calculator)
  console.log("\n🚚 SUITE 2: Pincode Transit Serviceability Calculator");

  await runTest("Serviceability", "Local Kochi Delivery (682019 -> 682025, 1.5 kg)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682025",
      weightKg: 1.5,
    });
    if (!res.data.success) throw new Error("Serviceability call was not successful");
    const { porter, courier } = res.data;
    if (!porter?.available) throw new Error("Porter not available in response");
    if (!courier?.rate) throw new Error("Courier rate missing");
    return `Porter Fare: ₹${porter.fare} (${porter.vehicle}, ${porter.estimatedTime}) | Courier: ₹${courier.rate} (${courier.courier})`;
  });

  await runTest("Serviceability", "Weight Preset: 0.5 kg (Accessories / Food)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682025",
      weightKg: 0.5,
    });
    const { porter, courier } = res.data;
    return `Weight 0.5kg -> Porter: ₹${porter.fare}, Courier: ₹${courier.rate}`;
  });

  await runTest("Serviceability", "Weight Preset: 2.0 kg (Filters / Pumps)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682025",
      weightKg: 2.0,
    });
    const { porter, courier } = res.data;
    return `Weight 2.0kg -> Porter: ₹${porter.fare}, Courier: ₹${courier.rate}`;
  });

  await runTest("Serviceability", "Weight Preset: 5.0 kg (Gravel / Hardscape)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682025",
      weightKg: 5.0,
    });
    const { porter, courier } = res.data;
    return `Weight 5.0kg -> Porter: ₹${porter.fare} (${porter.vehicle}), Courier: ₹${courier.rate}`;
  });

  await runTest("Serviceability", "Weight Preset: 15.0 kg (Heavy Glass Aquariums)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682025",
      weightKg: 15.0,
    });
    const { porter, courier } = res.data;
    return `Weight 15.0kg -> Porter: ₹${porter.fare} (${porter.vehicle}), Courier: ₹${courier.rate}`;
  });

  await runTest("Serviceability", "National Destination: Bangalore (560001, 2.5 kg)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "560001",
      weightKg: 2.5,
    });
    const { courier } = res.data;
    return `Bangalore Courier: ₹${courier.rate} (${courier.courier}, ETA: ${courier.estimatedDays})`;
  });

  await runTest("Serviceability", "National Destination: Delhi (110001, 1.0 kg)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "110001",
      weightKg: 1.0,
    });
    const { courier } = res.data;
    return `Delhi Courier: ₹${courier.rate} (${courier.courier}, ETA: ${courier.estimatedDays})`;
  });

  await runTest("Serviceability", "Validation: Missing delivery pincode returns 400 Bad Request", async () => {
    try {
      await axios.post(`${API_BASE}/shipping/serviceability`, {
        pickupPincode: "682019",
        deliveryPincode: "",
        weightKg: 1.5,
      });
      throw new Error("Expected 400 error was not thrown");
    } catch (err: any) {
      if (err.response?.status === 400) {
        return `Correctly rejected with 400: ${err.response.data.message}`;
      }
      throw err;
    }
  });

  // SUITE 3: GET /api/shipping/webhook (Webhook Listener Online Health Check)
  console.log("\n📡 SUITE 3: Shiprocket Webhook Listener Health");

  await runTest("Webhook Health", "GET /api/shipping/webhook responds active", async () => {
    const res = await axios.get(`${API_BASE}/shipping/webhook`);
    if (res.data.status !== "active") throw new Error("Status is not 'active'");
    return `Status: ${res.data.status} | ${res.data.service || "Webhook Listener Online"}`;
  });

  // SUITE 4: POST /api/shipping/webhook (Live Webhook Simulation & State Sync)
  console.log("\n⚡ SUITE 4: Webhook Simulation & Real-time State Synchronization");

  if (!sampleOrderNumber) {
    console.error("Skipping Suite 4: No sample order available");
    return;
  }

  const simulatedAWB = "AWB-TEST-" + Math.floor(100000 + Math.random() * 900000);

  await runTest("Webhook Sync", `Simulate 'OUT FOR DELIVERY' on Order #${sampleOrderNumber}`, async () => {
    const res = await axios.post(
      `${API_BASE}/shipping/webhook`,
      {
        order_id: sampleOrderNumber,
        awb: simulatedAWB,
        current_status: "OUT FOR DELIVERY",
        location: "Kochi Marine Drive Distribution Hub",
        courier_name: "Porter / Shiprocket Local Express",
        scans: [
          {
            date: new Date().toISOString(),
            status: "OUT FOR DELIVERY",
            activity: "Simulated test event: Rider dispatched for final doorstep delivery",
            location: "Kochi Marine Drive Distribution Hub",
          },
        ],
      },
      adminHeaders
    );

    if (!res.data.success) throw new Error(res.data.message || "Webhook processing failed");
    return `Updated orderStatus to: ${res.data.data?.orderStatus}, AWB: ${res.data.data?.awbCode}`;
  });

  await runTest("Live Queue Verification", "Order now appears in Live Transit Queue (orderStatus = 'Out for Delivery')", async () => {
    const res = await axios.get(`${API_BASE}/orders`, adminHeaders);
    const updatedOrder = res.data.data.find((o: any) => o.orderNumber === sampleOrderNumber);
    if (!updatedOrder) throw new Error("Order not found in /orders");
    if (updatedOrder.orderStatus !== "Out for Delivery") {
      throw new Error(`Expected 'Out for Delivery', got '${updatedOrder.orderStatus}'`);
    }
    const inTransit = res.data.data.filter((o: any) => o.orderStatus === "Out for Delivery" || o.orderStatus === "Packed").length;
    return `Verified! Order #${sampleOrderNumber} is in Live Transit Queue. Total in-transit count: ${inTransit}`;
  });

  // SUITE 5: GET /api/shipping/track/:awbOrOrderId (Customer & Admin Real-time Tracking)
  console.log("\n🔎 SUITE 5: Real-time Order Tracking Endpoint");

  await runTest("Tracking Query", `Track by Order Number #${sampleOrderNumber}`, async () => {
    const res = await axios.get(`${API_BASE}/shipping/track/${sampleOrderNumber}`);
    if (!res.data.success) throw new Error("Tracking endpoint returned failure");
    const data = res.data.data;
    if (data.orderStatus !== "Out for Delivery") {
      throw new Error(`Expected 'Out for Delivery', got ${data.orderStatus}`);
    }
    if (!Array.isArray(data.activities) || data.activities.length === 0) {
      throw new Error("Activities timeline is empty");
    }
    const latest = data.activities[data.activities.length - 1];
    return `Status: ${data.currentStatus} | Activities: ${data.activities.length} entries | Latest: ${latest.activity}`;
  });

  await runTest("Tracking Query", `Track by simulated AWB Code (${simulatedAWB})`, async () => {
    const res = await axios.get(`${API_BASE}/shipping/track/${simulatedAWB}`);
    if (!res.data.success) throw new Error("Tracking by AWB failed");
    return `Successfully resolved AWB: ${res.data.data.awbCode} for Order: ${res.data.data.orderNumber}`;
  });

  await runTest("Tracking Query", "Tracking non-existent Order ID returns 404 gracefully", async () => {
    try {
      await axios.get(`${API_BASE}/shipping/track/NON_EXISTENT_ORDER_999999`);
      throw new Error("Expected 404 was not thrown");
    } catch (err: any) {
      if (err.response?.status === 404) {
        return `Clean 404 handled: "${err.response.data.message}"`;
      }
      throw err;
    }
  });

  // SUITE 6: Final Webhook Delivery Cycle & Reset
  console.log("\n📦 SUITE 6: Final Lifecycle Progression (DELIVERED)");

  await runTest("Lifecycle Sync", `Simulate 'DELIVERED' status on Order #${sampleOrderNumber}`, async () => {
    const res = await axios.post(
      `${API_BASE}/shipping/webhook`,
      {
        order_id: sampleOrderNumber,
        awb: simulatedAWB,
        current_status: "DELIVERED",
        location: "Kochi Marine Drive Customer Address",
        scans: [
          {
            date: new Date().toISOString(),
            status: "DELIVERED",
            activity: "Package handed over to recipient. Delivery confirmed.",
            location: "Kochi Marine Drive Customer Address",
          },
        ],
      },
      adminHeaders
    );

    if (!res.data.success) throw new Error("Delivery webhook failed");
    return `Order status set to '${res.data.data?.orderStatus}' (Delivered & Paid)`;
  });

  // SUMMARY REPORT
  console.log("\n==================================================================");
  console.log("📊 TEST EXECUTION SUMMARY");
  console.log("==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log(`Total Tests Executed: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("\n🎉 ALL SHIPPING & LOGISTICS APIS PASSED DEEP VERIFICATION!\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
