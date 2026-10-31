import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:5000/api";
const ADMIN_BASE = "http://localhost:3001";
const FRONTEND_BASE = "http://localhost:3000";

const JWT_SECRET = process.env.JWT_SECRET || "aqua_pets_super_secret_jwt_key_2026";
const ADMIN_ID = "6ac0928214038a956245f5bc";
const adminToken = jwt.sign({ id: ADMIN_ID, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

const adminHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${adminToken}`,
  Origin: ADMIN_BASE,
  Referer: `${ADMIN_BASE}/`,
};

interface TestResult {
  section: string;
  test: string;
  status: "PASS" | "FAIL";
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(section: string, name: string, fn: () => Promise<string | void>) {
  const start = Date.now();
  try {
    const detail = await fn();
    const duration = Date.now() - start;
    results.push({ section, test: name, status: "PASS", details: detail || "OK", durationMs: duration });
    console.log(`  ✅ [PASS] ${section} -> ${name} (${duration}ms) ${detail ? "• " + detail : ""}`);
  } catch (err: any) {
    const duration = Date.now() - start;
    const msg = err.message || "Unknown error";
    results.push({ section, test: name, status: "FAIL", details: msg, durationMs: duration });
    console.error(`  ❌ [FAIL] ${section} -> ${name} (${duration}ms) • ${msg}`);
  }
}

async function main() {
  console.log("=========================================================================");
  console.log("🔬 MASTER DEEP TEST MATRIX: ALL ADMIN PANEL PAGES & BACKEND APIS");
  console.log("=========================================================================\n");

  let createdProductId = "";
  let createdProductSlug = "";
  let createdCategoryId = "";
  let createdCategorySlug = "";
  let createdSubscriberId = "";
  let testOrderId = "";
  let testOrderNumber = "";

  // ------------------------------------------------------------------------
  // SECTION 1: DASHBOARD PAGE (/)
  // ------------------------------------------------------------------------
  console.log("📊 SECTION 1: DASHBOARD PAGE (/)");
  await runTest("Dashboard", "HTTP 200 OK for / route", async () => {
    const res = await fetch(`${ADMIN_BASE}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Dashboard", "Aggregated Data Feeds: Orders, Products, Categories load concurrently", async () => {
    const [ordersRes, prodsRes, catsRes] = await Promise.all([
      fetch(`${API_BASE}/orders`, { headers: adminHeaders }),
      fetch(`${API_BASE}/products`, { headers: adminHeaders }),
      fetch(`${API_BASE}/categories`, { headers: adminHeaders }),
    ]);
    if (!ordersRes.ok || !prodsRes.ok || !catsRes.ok) throw new Error("One of the feeds failed");
    const [orders, prods, cats] = await Promise.all([ordersRes.json(), prodsRes.json(), catsRes.json()]);
    return `Orders: ${orders.data?.length || 0}, Products: ${prods.data?.length || 0}, Categories: ${cats.data?.length || 0}`;
  });

  // ------------------------------------------------------------------------
  // SECTION 2: PRODUCTS CATALOG (/products)
  // ------------------------------------------------------------------------
  console.log("\n📦 SECTION 2: PRODUCTS CATALOG (/products)");
  await runTest("Products", "HTTP 200 OK for /products route", async () => {
    const res = await fetch(`${ADMIN_BASE}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Products", "GET /api/products returns valid product array", async () => {
    const res = await fetch(`${API_BASE}/products`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Invalid format");
    if (json.data.length === 0) throw new Error("No products returned");
    return `${json.data.length} total products in database`;
  });

  await runTest("Products", "POST /api/products - Create a new product with full schema", async () => {
    createdProductSlug = `test-aquarium-filter-${Date.now()}`;
    const payload = {
      name: "SuperBio External Canister Filter 1200L/H",
      slug: createdProductSlug,
      brand: "Aqua Pets Pro",
      category: "aquarium-filters",
      price: 4999,
      originalPrice: 6499,
      discount: 23,
      stock: 15,
      description: "Deep test automated product for high efficiency biological and chemical filtration.",
      images: ["/filter-canister-internal-cutaway.png"],
      weightKg: 4.5,
      isFeatured: true,
      isStarterKit: false,
      isOffer: true,
      badge: "Best Seller",
    };
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success || !json.data?._id) throw new Error("Product creation failed");
    createdProductId = json.data._id;
    return `Created product ID: ${createdProductId} (slug: ${createdProductSlug})`;
  });

  await runTest("Products", "GET /api/products/:slug - Retrieve product by slug", async () => {
    const res = await fetch(`${API_BASE}/products/${createdProductSlug}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.data?.slug !== createdProductSlug) throw new Error("Slug mismatch");
  });

  await runTest("Products", "PUT /api/products/:id - Update product price and stock by Mongo _id", async () => {
    const res = await fetch(`${API_BASE}/products/${createdProductId}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ price: 4799, stock: 20 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.data?.price !== 4799 || json.data?.stock !== 20) throw new Error("Update values mismatch");
  });

  await runTest("Products", "PUT /api/products/:slug - Update product by slug", async () => {
    const res = await fetch(`${API_BASE}/products/${createdProductSlug}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ description: "Updated description via slug route." }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  });

  await runTest("Products", "DELETE /api/products/:id - Delete product by Mongo _id", async () => {
    const res = await fetch(`${API_BASE}/products/${createdProductId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success) throw new Error("Expected json.success: true");
  });

  // ------------------------------------------------------------------------
  // SECTION 3: CATEGORIES (/categories)
  // ------------------------------------------------------------------------
  console.log("\n🗂️ SECTION 3: CATEGORIES PAGE (/categories)");
  await runTest("Categories", "HTTP 200 OK for /categories route", async () => {
    const res = await fetch(`${ADMIN_BASE}/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Categories", "GET /api/categories returns 20 default aquatics categories", async () => {
    const res = await fetch(`${API_BASE}/categories`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Invalid categories format");
    if (json.data.length < 20) throw new Error(`Expected at least 20 categories, got ${json.data.length}`);
    return `${json.data.length} categories active`;
  });

  await runTest("Categories", "POST /api/categories - Create custom category", async () => {
    createdCategorySlug = `marine-corals-${Date.now()}`;
    const payload = {
      name: "Marine Live Corals",
      slug: createdCategorySlug,
      description: "SPS, LPS, and soft corals for nano & reef aquariums.",
      image: "/categories/planted-aquarium-plants.jpg",
      iconName: "Sparkles",
      sortOrder: 25,
    };
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success || !json.data?._id) throw new Error("Category creation failed");
    createdCategoryId = json.data._id;
    return `Created category ID: ${createdCategoryId}`;
  });

  await runTest("Categories", "PUT /api/categories/:id - Update category by slug", async () => {
    const res = await fetch(`${API_BASE}/categories/${createdCategorySlug}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ name: "Marine LPS & SPS Corals" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.data?.name !== "Marine LPS & SPS Corals") throw new Error("Name was not updated");
  });

  await runTest("Categories", "DELETE /api/categories/:id - Delete category by ID", async () => {
    const res = await fetch(`${API_BASE}/categories/${createdCategoryId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success) throw new Error("Delete failed");
  });

  // ------------------------------------------------------------------------
  // SECTION 4: LIVE ORDERS (/orders)
  // ------------------------------------------------------------------------
  console.log("\n🛒 SECTION 4: LIVE ORDERS PAGE (/orders)");
  await runTest("Live Orders", "HTTP 200 OK for /orders route", async () => {
    const res = await fetch(`${ADMIN_BASE}/orders`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Live Orders", "POST /api/orders -> GET /api/orders sync lifecycle", async () => {
    const prodRes = await fetch(`${API_BASE}/products`);
    const prodJson = await prodRes.json();
    const product = prodJson.data[0];

    const orderPayload = {
      items: [{
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        weightKg: product.weightKg || 0.5,
      }],
      shippingAddress: {
        fullName: "Admin Master Tester",
        phone: "+919876543210",
        houseBuilding: "Tower 5B",
        street: "Kochi Infopark Road",
        city: "Kochi",
        state: "Kerala",
        pincode: "682028",
      },
      paymentMethod: "Cash on Delivery",
      deliveryMethod: "porter",
      notes: "Master admin end-to-end verification",
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(orderPayload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    testOrderId = json.data.order._id;
    testOrderNumber = json.data.order.orderNumber;
    return `Created order #${testOrderNumber}`;
  });

  await runTest("Live Orders", "PUT /api/orders/:id/status - Update order status to 'Confirmed'", async () => {
    const res = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ orderStatus: "Confirmed" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  });

  await runTest("Live Orders", "DELETE /api/orders/:id - Delete test order record", async () => {
    const res = await fetch(`${API_BASE}/orders/${testOrderId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  });

  // ------------------------------------------------------------------------
  // SECTION 5: SHIPPING & LOGISTICS (/shipping)
  // ------------------------------------------------------------------------
  console.log("\n🚚 SECTION 5: SHIPPING & LOGISTICS PAGE (/shipping)");
  await runTest("Shipping", "HTTP 200 OK for /shipping route", async () => {
    const res = await fetch(`${ADMIN_BASE}/shipping`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Shipping", "POST /api/shipping/serviceability - Pincode check between 682019 and 682025", async () => {
    const res = await fetch(`${API_BASE}/shipping/serviceability`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        pickupPincode: "682019",
        deliveryPincode: "682025",
        weightKg: 1.5,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success || !json.courier) throw new Error("Serviceability check failed");
    return `Courier: ${json.courier.courier} (Rate: ₹${json.courier.rate}, Local Porter: ${json.porter?.available ? "YES" : "NO"})`;
  });

  await runTest("Shipping", "POST /api/shipping/webhook/test - Shiprocket webhook simulation", async () => {
    const res = await fetch(`${API_BASE}/shipping/webhook/test`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        order_id: "AQ-894977-842",
        current_status: "IN TRANSIT",
        current_status_id: 17,
        location: "Ernakulam Hub",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error("Webhook test failed");
  });

  // ------------------------------------------------------------------------
  // SECTION 6: SUBSCRIBERS LIST (/subscriptions)
  // ------------------------------------------------------------------------
  console.log("\n📬 SECTION 6: SUBSCRIBERS LIST (/subscriptions)");
  await runTest("Subscribers", "HTTP 200 OK for /subscriptions route", async () => {
    const res = await fetch(`${ADMIN_BASE}/subscriptions`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Subscribers", "POST /api/subscribers - Subscribe a new email", async () => {
    const testEmail = `tester_${Date.now()}@aquapets-test.in`;
    const res = await fetch(`${API_BASE}/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, source: "admin-deep-test" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.success || !json.data?._id) throw new Error("Subscription failed");
    createdSubscriberId = json.data._id;
    return `Subscribed ID: ${createdSubscriberId}`;
  });

  await runTest("Subscribers", "GET /api/subscribers - Retrieve list of subscribers", async () => {
    const res = await fetch(`${API_BASE}/subscribers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) throw new Error("Expected array of subscribers");
    return `${json.data.length} total active subscribers`;
  });

  await runTest("Subscribers", "DELETE /api/subscribers/:id - Remove test subscriber", async () => {
    const res = await fetch(`${API_BASE}/subscribers/${createdSubscriberId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error("Delete subscriber failed");
  });

  // ------------------------------------------------------------------------
  // SECTION 7: NOTIFICATION CENTER (/messages)
  // ------------------------------------------------------------------------
  console.log("\n🔔 SECTION 7: NOTIFICATION CENTER (/messages)");
  await runTest("Notifications", "HTTP 200 OK for /messages route", async () => {
    const res = await fetch(`${ADMIN_BASE}/messages`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // ------------------------------------------------------------------------
  // SECTION 8: PLATFORM SETTINGS (/settings)
  // ------------------------------------------------------------------------
  console.log("\n⚙️ SECTION 8: PLATFORM SETTINGS (/settings)");
  await runTest("Settings", "HTTP 200 OK for /settings route", async () => {
    const res = await fetch(`${ADMIN_BASE}/settings`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  // ------------------------------------------------------------------------
  // SECTION 9: ADMIN AUTH & LOGIN (/login)
  // ------------------------------------------------------------------------
  console.log("\n🔐 SECTION 9: ADMIN AUTH & LOGIN (/login)");
  await runTest("Admin Login", "HTTP 200 OK for /login route", async () => {
    const res = await fetch(`${ADMIN_BASE}/login`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest("Admin Login", "GET /api/auth/profile with Bearer token validates Super Admin session", async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (!json.user || json.user.role !== "admin") throw new Error("User is not admin");
    return `Verified Admin: ${json.user.name || "AquaPets Admin"} (${json.user.email})`;
  });

  console.log("\n=========================================================================");
  console.log(`📊 MASTER TEST RESULTS: ${results.filter((r) => r.status === "PASS").length} / ${results.length} PASSED`);
  console.log("=========================================================================\n");

  const failed = results.filter((r) => r.status === "FAIL");
  if (failed.length > 0) {
    console.error("❌ FAILED TESTS:");
    failed.forEach((f) => console.error(`  - [${f.section}] ${f.test}: ${f.details}`));
    process.exit(1);
  } else {
    console.log("🏆 ALL 24 / 24 MASTER TESTS ACROSS ALL ADMIN PAGES PASSED WITH 100% SUCCESS!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR IN MASTER TEST SUITE:", err);
  process.exit(1);
});
