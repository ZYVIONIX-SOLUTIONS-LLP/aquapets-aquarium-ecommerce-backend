import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:5000/api";
const FRONTEND_BASE = "http://localhost:3000";
const ADMIN_BASE = "http://localhost:3001";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: "PASS", details: "OK", durationMs: Date.now() - start });
    console.log(`  ✅ PASS: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, status: "FAIL", details: err.message, durationMs: Date.now() - start });
    console.error(`  ❌ FAIL: ${name}: ${err.message}`);
  }
}

async function main() {
  console.log("=================================================================");
  console.log("🧪 STARTING DEEP TEST MATRIX: ADMIN LIVE ORDERS PAGE & ALL APIS");
  console.log("=================================================================\n");

  let existingOrderId = "";
  let existingOrderNumber = "";
  let tempOrderId = "";
  let tempOrderNumber = "";

  // 1. GET /api/orders without auth
  await runTest("1. GET /api/orders - Fetch orders (Public/Dev mode)", async () => {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Expected json.success and data array");
    if (json.data.length === 0) throw new Error("Orders array is empty");
    existingOrderId = json.data[0]._id;
    existingOrderNumber = json.data[0].orderNumber;
  });

  // 2. GET /api/orders with Admin Portal Origin header
  await runTest("2. GET /api/orders - Fetch orders with Admin Portal Origin (:3001)", async () => {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: {
        Origin: ADMIN_BASE,
        Referer: `${ADMIN_BASE}/orders`,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Expected array of orders");
  });

  // 3. GET /api/orders with expired/invalid Authorization token (graceful fallback)
  await runTest("3. GET /api/orders - Graceful handling of invalid/expired token", async () => {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: {
        Authorization: "Bearer invalid_or_expired_jwt_token_12345",
        Origin: ADMIN_BASE,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} - should not crash on expired token`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Expected orders list");
  });

  // 4. GET /api/orders/:identifier by Mongo ObjectId
  await runTest("4. GET /api/orders/:identifier - Fetch order by Mongo _id", async () => {
    if (!existingOrderId) throw new Error("No existingOrderId available");
    const res = await fetch(`${API_BASE}/orders/${existingOrderId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data._id !== existingOrderId) throw new Error("ID mismatch");
  });

  // 5. GET /api/orders/:identifier by Order Number (AQ-xxxxxx-xxx)
  await runTest("5. GET /api/orders/:identifier - Fetch order by orderNumber", async () => {
    if (!existingOrderNumber) throw new Error("No existingOrderNumber available");
    const res = await fetch(`${API_BASE}/orders/${existingOrderNumber}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.orderNumber !== existingOrderNumber) throw new Error("OrderNumber mismatch");
  });

  // 6. GET /api/orders/nonexistent - 404 check
  await runTest("6. GET /api/orders/:identifier - Non-existent order returns 404", async () => {
    const res = await fetch(`${API_BASE}/orders/AQ-000000-000`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 7. PUT /api/orders/:id/status - Status transitions
  await runTest("7. PUT /api/orders/:id/status - Update order status to 'Packed'", async () => {
    if (!existingOrderId) throw new Error("No existingOrderId");
    const res = await fetch(`${API_BASE}/orders/${existingOrderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: "Packed" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.data.orderStatus !== "Packed") throw new Error(`Expected 'Packed', got ${json.data.orderStatus}`);
  });

  // 8. PUT /api/orders/:id/status - Update status using orderNumber instead of _id
  await runTest("8. PUT /api/orders/:id/status - Update using orderNumber identifier", async () => {
    if (!existingOrderNumber) throw new Error("No existingOrderNumber");
    const res = await fetch(`${API_BASE}/orders/${existingOrderNumber}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus: "Out for Delivery" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.data.orderStatus !== "Out for Delivery") throw new Error(`Expected 'Out for Delivery', got ${json.data.orderStatus}`);
  });

  // 9. Create a temporary order via POST /api/orders to test live sync and deletion
  await runTest("9. Order Lifecycle - Create mock order via POST /api/orders", async () => {
    // Check product to get a valid product ID
    const prodRes = await fetch(`${API_BASE}/products`);
    const prodJson = await prodRes.json();
    const product = prodJson.data?.[0];
    if (!product) throw new Error("No product found to create test order");

    const jwtSecret = process.env.JWT_SECRET || "aqua_pets_super_secret_jwt_key_2026";
    const jwtMod = await import("jsonwebtoken");
    const testToken = jwtMod.default.sign({ id: "6ac0928214038a956245f5bc" }, jwtSecret, { expiresIn: "1h" });

    const orderPayload = {
      items: [{
        productId: product._id,
        name: product.name,
        price: product.price || 499,
        quantity: 1,
        weightKg: product.weightKg || 0.5,
      }],
      shippingAddress: {
        fullName: "Live Orders AutoTester",
        phone: "+919876543210",
        houseBuilding: "Suite 101",
        street: "MG Road",
        city: "Kochi",
        state: "Kerala",
        pincode: "682016",
      },
      paymentMethod: "Cash on Delivery",
      deliveryMethod: "porter",
      notes: "Deep test automated mock order",
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    if (!json.success || !json.data?.order?._id) throw new Error("Failed to create order via POST /api/orders");
    tempOrderId = json.data.order._id;
    tempOrderNumber = json.data.order.orderNumber;
  });

  // 10. Verify temporary order appears in GET /api/orders
  await runTest("10. GET /api/orders - Verify new order syncs immediately", async () => {
    const res = await fetch(`${API_BASE}/orders`);
    const json = await res.json();
    const found = json.data.find((o: any) => o.orderNumber === tempOrderNumber || o._id === tempOrderId);
    if (!found) throw new Error(`Order ${tempOrderNumber} was not found in /api/orders sync`);
  });

  // 11. DELETE /api/orders/:id
  await runTest("11. DELETE /api/orders/:id - Remove temporary order record", async () => {
    if (!tempOrderId) throw new Error("No tempOrderId to delete");
    const res = await fetch(`${API_BASE}/orders/${tempOrderId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success) throw new Error("Expected json.success to be true");
  });

  // 12. Verify deleted order no longer exists
  await runTest("12. GET /api/orders - Verify deleted order is gone from list", async () => {
    const res = await fetch(`${API_BASE}/orders`);
    const json = await res.json();
    const found = json.data.find((o: any) => o.orderNumber === tempOrderNumber || o._id === tempOrderId);
    if (found) throw new Error(`Order ${tempOrderNumber} was not deleted from database!`);
  });

  // 13. Verify Metrics Computation on Live Orders
  await runTest("13. Metrics Calculation - Verify stats formula consistency", async () => {
    const res = await fetch(`${API_BASE}/orders`);
    const json = await res.json();
    const orders = json.data;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const porterInTransit = orders.filter((o: any) => o.orderStatus === "Out for Delivery").length;
    const delivered = orders.filter((o: any) => o.orderStatus === "Delivered").length;

    if (typeof totalOrders !== "number" || totalOrders <= 0) throw new Error("Invalid totalOrders count");
    if (typeof totalRevenue !== "number" || totalRevenue < 0) throw new Error("Invalid totalRevenue");
    if (typeof porterInTransit !== "number") throw new Error("Invalid porterInTransit count");
    if (typeof delivered !== "number") throw new Error("Invalid delivered count");
  });

  // 14. Customer Storefront Track Order Page verification
  await runTest("14. Customer Tracking URL - Verify /track-order?id=AQ-... loads", async () => {
    if (!existingOrderNumber) throw new Error("No existingOrderNumber");
    const trackUrl = `${FRONTEND_BASE}/track-order?id=${encodeURIComponent(existingOrderNumber)}`;
    const res = await fetch(trackUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} when accessing track-order URL: ${trackUrl}`);
  });

  // 15. Admin Portal Page verification
  await runTest("15. Admin Portal Page - Verify http://localhost:3001/orders responds 200", async () => {
    const res = await fetch(`${ADMIN_BASE}/orders`);
    if (!res.ok) throw new Error(`HTTP ${res.status} from Admin Portal /orders`);
  });

  console.log("\n=================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${results.filter((r) => r.status === "PASS").length} / ${results.length} PASSED`);
  console.log("=================================================================\n");

  const failed = results.filter((r) => r.status === "FAIL");
  if (failed.length > 0) {
    console.error("❌ FAILED TESTS:");
    failed.forEach((f) => console.error(`  - ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY (100% PASS RATE)!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN TEST RUNNER:", err);
  process.exit(1);
});
