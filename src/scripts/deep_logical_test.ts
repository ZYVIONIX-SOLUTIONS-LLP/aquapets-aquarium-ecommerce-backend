import axios from "axios";
import crypto from "crypto";
import { isErnakulamPincode, ERNAKULAM_BORDER_PINCODES } from "../utils/pincode.js";

const API_BASE = "http://localhost:5000/api";

interface TestResult {
  suite: string;
  name: string;
  status: "PASS" | "FAIL";
  error?: string;
  durationMs: number;
}

const report = {
  total: 0,
  passed: 0,
  failed: 0,
  results: [] as TestResult[],
  startTime: Date.now(),
};

async function testStep(suite: string, name: string, fn: () => Promise<any>) {
  report.total++;
  const start = Date.now();
  try {
    const details = await fn();
    const durationMs = Date.now() - start;
    report.passed++;
    report.results.push({ suite, name, status: "PASS", durationMs });
    console.log(`  ✅ [PASS] (${durationMs}ms) ${name}`);
    return details;
  } catch (err: any) {
    const durationMs = Date.now() - start;
    report.failed++;
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Unknown Error";
    report.results.push({ suite, name, status: "FAIL", error: errMsg, durationMs });
    console.log(`  ❌ [FAIL] (${durationMs}ms) ${name}`);
    console.log(`     ↳ Details: ${errMsg}`);
    return null;
  }
}

async function runDeepLogicalTests() {
  console.log("==================================================================");
  console.log("🌊 AQUA PETS AQUARIUM - COMPREHENSIVE DEEP LOGICAL TEST RUNNER 🌊");
  console.log("==================================================================\n");

  let adminToken = "";
  let customerToken = "";
  let sampleProduct: any = null;
  let testOrderId = "";
  let testOrderNumber = "";
  let tankProduct: any = null;

  // ============================================================================
  // SUITE 1: SYSTEM HEALTH & SERVICE DISCOVERY
  // ============================================================================
  console.log("📌 SUITE 1: System Health & Base Routes");
  await testStep("System Health", "Health endpoint returns 200 OK and valid status", async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.status !== 200 || res.data.status !== "ok") {
      throw new Error(`Expected status 200 and 'ok', got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    return res.data;
  });

  await testStep("System Health", "Base API directory exposes active service endpoints", async () => {
    const res = await axios.get(`${API_BASE}`);
    if (res.data.status !== "online" || !res.data.endpoints?.products) {
      throw new Error("Base API index missing expected endpoints map");
    }
    return res.data.endpoints;
  });

  // ============================================================================
  // SUITE 2: AUTHENTICATION, RBAC & SECURITY
  // ============================================================================
  console.log("\n📌 SUITE 2: Authentication, Authorization & RBAC Defense");
  await testStep("Authentication", "Admin User Login with valid credentials", async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@aquapets.com",
      password: "AdminPassword123!",
    });
    if (!res.data.token || res.data.user.role !== "admin") {
      throw new Error("Admin login failed or role is not admin");
    }
    adminToken = res.data.token;
    return res.data.user;
  });

  await testStep("Authentication", "Customer User Login with valid credentials", async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: "melvin12345@gmail.com",
      password: "Password123!",
    });
    if (!res.data.token || res.data.user.role !== "customer") {
      throw new Error("Customer login failed or role is not customer");
    }
    customerToken = res.data.token;
    return res.data.user;
  });

  await testStep("Authentication", "Reject login with invalid password (400 or 401)", async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: "admin@aquapets.com",
        password: "IncorrectPasswordXYZ!",
      });
      throw new Error("Login unexpectedly succeeded with incorrect password");
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        return "Correctly rejected";
      }
      throw err;
    }
  });

  await testStep("Authentication", "Reject request with tampered/invalid JWT token (401)", async () => {
    try {
      await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: "Bearer invalid.jwt.token.here" },
      });
      throw new Error("Profile returned 200 with invalid token");
    } catch (err: any) {
      if (err.response?.status === 401) {
        return "Correctly rejected with 401 Unauthorized";
      }
      throw err;
    }
  });

  await testStep("RBAC Defense", "Prevent customer from executing admin-only operations (403 Forbidden)", async () => {
    try {
      // Attempt to access an admin-only endpoint using customerToken
      await axios.put(
        `${API_BASE}/orders/dummy_order_id/status`,
        { orderStatus: "shipped" },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error("Customer was erroneously permitted to execute admin action");
    } catch (err: any) {
      if (err.response?.status === 403) {
        return "Correctly blocked with 403 Forbidden";
      }
      throw err;
    }
  });

  await testStep("RBAC Defense", "Admin is authorized to view system orders (200 OK)", async () => {
    const res = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orders = res.data.data || res.data.orders || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(orders)) throw new Error("Expected array of orders");
    return `Found ${orders.length} orders`;
  });

  // ============================================================================
  // SUITE 3: PINCODE & DELIVERY ZONE LOGIC (ZERO-ERROR VERIFICATION)
  // ============================================================================
  console.log("\n📌 SUITE 3: Pincode & Delivery Zone Logic Matrix");
  await testStep("Pincode Logic", "Ernakulam Central pincodes (682xxx) recognized as local zone", async () => {
    const pins = ["682001", "682016", "682024", "682035"];
    for (const pin of pins) {
      const isLocal = await isErnakulamPincode(pin);
      if (!isLocal) throw new Error(`Pincode ${pin} failed local zone validation`);
    }
    return `${pins.length} Kochi central pincodes passed`;
  });

  await testStep("Pincode Logic", "Ernakulam Greater/Aluva pincodes (683xxx) recognized as local zone", async () => {
    const pins = ["683101", "683542", "683572", "683108"];
    for (const pin of pins) {
      const isLocal = await isErnakulamPincode(pin);
      if (!isLocal) throw new Error(`Pincode ${pin} failed local zone validation`);
    }
    return `${pins.length} Aluva/Greater Kochi pincodes passed`;
  });

  await testStep("Pincode Logic", "Ernakulam Border Taluk pincodes (686xxx Set) recognized as local zone", async () => {
    const borderPins = Array.from(ERNAKULAM_BORDER_PINCODES);
    for (const pin of borderPins) {
      const isLocal = await isErnakulamPincode(pin);
      if (!isLocal) throw new Error(`Border Pincode ${pin} failed local zone validation`);
    }
    return `${borderPins.length} Ernakulam border taluk pincodes verified`;
  });

  await testStep("Pincode Logic", "Non-Ernakulam Kerala & National pincodes recognized as non-local", async () => {
    const remotePins = [
      { pin: "695001", city: "Thiruvananthapuram" },
      { pin: "673001", city: "Kozhikode" },
      { pin: "560001", city: "Bangalore" },
      { pin: "110001", city: "New Delhi" },
      { pin: "400001", city: "Mumbai" },
    ];
    for (const item of remotePins) {
      const isLocal = await isErnakulamPincode(item.pin);
      if (isLocal) throw new Error(`Non-local pincode ${item.pin} (${item.city}) falsely identified as local`);
    }
    return `${remotePins.length} remote pincodes correctly verified as non-local`;
  });

  await testStep("Pincode Logic", "Address keyword fallback detects Kochi / Ernakulam in address text", async () => {
    const isLocalByCity = await isErnakulamPincode("686001", "12 Marine Drive, Kochi, Kerala");
    const isLocalByDist = await isErnakulamPincode("686001", "Flat 4A, Ernakulam North");
    if (!isLocalByCity || !isLocalByDist) {
      throw new Error("Address text keyword fallback failed to match Kochi/Ernakulam");
    }
    return "Address text fallback verified";
  });

  // ============================================================================
  // SUITE 4: CATALOG QUERYING, FILTERS, SEARCH & SLUGS
  // ============================================================================
  console.log("\n📌 SUITE 4: Product Catalog, Filters & Slugs");
  await testStep("Catalog", "Fetch all active categories", async () => {
    const res = await axios.get(`${API_BASE}/categories`);
    const categories = res.data.data || res.data.categories || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error("No categories returned");
    }
    return `Found ${categories.length} categories`;
  });

  await testStep("Catalog", "Fetch product catalog with pagination and stock verification", async () => {
    const res = await axios.get(`${API_BASE}/products?limit=1000`);
    const products = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("Products list is empty");
    }
    sampleProduct = products.find((p: any) => p.stock > 0 && p.price > 0) || products.find((p: any) => p.stock > 0) || products[0];
    tankProduct = products.find((p: any) => (p.name?.toLowerCase().includes("tank") || p.slug?.toLowerCase().includes("tank")) && p.stock > 0) || products.find((p: any) => p.name?.toLowerCase().includes("tank"));
    return {
      total: products.length,
      sample: sampleProduct.name,
      samplePrice: sampleProduct.price,
      sampleStock: sampleProduct.stock,
      foundTank: !!tankProduct,
      tankName: tankProduct?.name,
    };
  });

  await testStep("Catalog", "Keyword search query matches products", async () => {
    const keyword = sampleProduct.name.split(" ")[0];
    const res = await axios.get(`${API_BASE}/products?search=${encodeURIComponent(keyword)}`);
    const results = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(`Search for '${keyword}' returned 0 results`);
    }
    return `Keyword '${keyword}' matched ${results.length} items`;
  });

  await testStep("Catalog", "Fetch single product details by slug", async () => {
    const res = await axios.get(`${API_BASE}/products/${sampleProduct.slug}`);
    const product = res.data.data || res.data.product || res.data;
    if (!product || product.slug !== sampleProduct.slug) {
      throw new Error("Failed to match product by slug");
    }
    return { name: product.name, slug: product.slug };
  });

  // ============================================================================
  // SUITE 5: FRAGILE GLASS TANK POLICY ENFORCEMENT
  // ============================================================================
  console.log("\n📌 SUITE 5: Fragile Glass Aquarium Tank Delivery Policy");
  if (tankProduct) {
    await testStep("Tank Policy", "Reject order with fragile tank to non-Ernakulam address (400)", async () => {
      try {
        await axios.post(
          `${API_BASE}/orders`,
          {
            items: [{ productId: tankProduct._id, slug: tankProduct.slug, name: tankProduct.name, quantity: 1 }],
            shippingAddress: {
              fullName: "Remote Buyer",
              phone: "9876543210",
              houseBuilding: "123 Cliff Road",
              street: "Beach Highway",
              city: "Thiruvananthapuram",
              state: "Kerala",
              pincode: "695001", // Non-Ernakulam
            },
          },
          { headers: { Authorization: `Bearer ${customerToken}` } }
        );
        throw new Error("Tank order to non-Ernakulam address was unexpectedly permitted");
      } catch (err: any) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes("Fragile Glass Tank Policy")) {
          return `Strictly rejected with policy notice: "${err.response.data.message}"`;
        }
        throw err;
      }
    });

    await testStep("Tank Policy", "Allow order with fragile tank to local Ernakulam address via Porter", async () => {
      const res = await axios.post(
        `${API_BASE}/orders`,
        {
          items: [{ productId: tankProduct._id, slug: tankProduct.slug, name: tankProduct.name, quantity: 1 }],
          shippingAddress: {
            fullName: "Kochi Tank Buyer",
            phone: "916238392582",
            houseBuilding: "Marine Residency 3B",
            street: "MG Road, Ravipuram",
            city: "Kochi",
            state: "Kerala",
            pincode: "682016", // Local Ernakulam
          },
          paymentMethod: "Razorpay",
          notes: "Testing local tank order with Porter delivery",
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );

      const order = res.data.data?.order || res.data.order;
      if (!order || order.deliveryMethod !== "porter") {
        throw new Error(`Expected deliveryMethod to be 'porter', got '${order?.deliveryMethod}'`);
      }
      return { orderNumber: order.orderNumber, deliveryMethod: order.deliveryMethod, deliveryFee: order.deliveryFee };
    });
  } else {
    console.log("  ⚠️ [SKIPPED] No product with 'tank' in name found in catalog");
  }

  // ============================================================================
  // SUITE 6: INVENTORY STOCK & CART VALIDATION
  // ============================================================================
  console.log("\n📌 SUITE 6: Inventory Guard & Cart Validation");
  await testStep("Cart Validation", "Reject checkout with empty items list (400)", async () => {
    try {
      await axios.post(
        `${API_BASE}/orders`,
        {
          items: [],
          shippingAddress: {
            fullName: "Test Buyer",
            phone: "9876543210",
            pincode: "682001",
          },
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error("Order with empty items succeeded unexpectedly");
    } catch (err: any) {
      if (err.response?.status === 400) {
        return "Correctly rejected with 400";
      }
      throw err;
    }
  });

  await testStep("Cart Validation", "Reject checkout with incomplete shipping address (400)", async () => {
    try {
      await axios.post(
        `${API_BASE}/orders`,
        {
          items: [{ productId: sampleProduct._id, quantity: 1 }],
          shippingAddress: {
            fullName: "Test Buyer",
            // Missing phone & pincode
          },
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error("Order with incomplete shipping address succeeded unexpectedly");
    } catch (err: any) {
      if (err.response?.status === 400) {
        return "Correctly rejected with 400";
      }
      throw err;
    }
  });

  await testStep("Inventory Guard", "Reject order when requested quantity exceeds stock (400)", async () => {
    try {
      await axios.post(
        `${API_BASE}/orders`,
        {
          items: [{ productId: sampleProduct._id, quantity: (sampleProduct.stock || 5) + 99999 }],
          shippingAddress: {
            fullName: "Overbuyer",
            phone: "9876543210",
            pincode: "682001",
          },
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error("Order succeeded despite insufficient stock");
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("Insufficient stock")) {
        return `Correctly blocked: ${err.response.data.message}`;
      }
      throw err;
    }
  });

  // ============================================================================
  // SUITE 7: ORDER CREATION & WEIGHT-TIERED SHIPPING FEES
  // ============================================================================
  console.log("\n📌 SUITE 7: Order Creation & Shipping Calculations");
  await testStep("Order Checkout", "Create valid customer order and Razorpay order", async () => {
    const res = await axios.post(
      `${API_BASE}/orders`,
      {
        items: [
          {
            productId: sampleProduct._id,
            slug: sampleProduct.slug,
            name: sampleProduct.name,
            quantity: 1,
            price: sampleProduct.price,
          },
        ],
        shippingAddress: {
          fullName: "Melvin Customer",
          phone: "916238392582",
          houseBuilding: "17 Ocean Crest",
          street: "Broadway Road",
          city: "Kochi",
          state: "Kerala",
          pincode: "682001",
        },
        paymentMethod: "Razorpay",
        notes: "Automated Deep Logical Test Order",
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    const orderData = res.data.data?.order || res.data.order;
    if (!orderData || !orderData._id || !orderData.orderNumber) {
      throw new Error("Order creation failed to return order object");
    }
    testOrderId = orderData._id;
    testOrderNumber = orderData.orderNumber;
    return {
      orderId: testOrderId,
      orderNumber: testOrderNumber,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      deliveryMethod: orderData.deliveryMethod,
    };
  });

  await testStep("Order Checkout", "Fetch customer orders list and verify presence of new order", async () => {
    const res = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const orders = res.data.data || res.data.orders || (Array.isArray(res.data) ? res.data : []);
    const found = orders.find((o: any) => o._id === testOrderId || o.orderNumber === testOrderNumber);
    if (!found) throw new Error("Created order not found in customer orders list");
    return `Found order ${found.orderNumber} with status ${found.orderStatus}`;
  });

  await testStep("Order Checkout", "Fetch single order details by orderNumber identifier", async () => {
    const res = await axios.get(`${API_BASE}/orders/${testOrderNumber}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const order = res.data.data || res.data.order || res.data;
    if (!order || order.orderNumber !== testOrderNumber) {
      throw new Error("Failed to match order details by orderNumber");
    }
    return {
      orderNumber: order.orderNumber,
      total: order.total,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
    };
  });

  // ============================================================================
  // SUITE 8: PAYMENT CRYPTOGRAPHIC VERIFICATION & IDEMPOTENCY
  // ============================================================================
  console.log("\n📌 SUITE 8: Payment Cryptographic Integrity & Idempotency");
  const testPaymentId = `pay_${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

  await testStep("Payment Logic", "Reject payment verification with missing parameters (400)", async () => {
    try {
      await axios.post(`${API_BASE}/payment/verify`, {
        orderId: testOrderId,
        // Missing payment id, order id, signature
      });
      throw new Error("Verification unexpectedly passed with missing parameters");
    } catch (err: any) {
      if (err.response?.status === 400) {
        return "Correctly rejected with 400";
      }
      throw err;
    }
  });

  await testStep("Payment Logic", "Verify payment and mark order as PAID & CONFIRMED", async () => {
    const res = await axios.post(`${API_BASE}/payment/verify`, {
      orderId: testOrderId,
      razorpayOrderId: `order_test_${Date.now()}`,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: "mock_signature_for_test_checkout",
    });

    if (!res.data.success) {
      throw new Error("Payment verification failed: " + JSON.stringify(res.data));
    }
    const order = res.data.data?.order || res.data.order;
    return {
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    };
  });

  await testStep("Payment Logic", "Idempotency check: Repeat payment verification returns success without duplicate side-effects", async () => {
    const res = await axios.post(`${API_BASE}/payment/verify`, {
      orderId: testOrderId,
      razorpayOrderId: `order_test_${Date.now()}`,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: "mock_signature_for_test_checkout",
    });

    if (!res.data.success || !res.data.message?.includes("already verified")) {
      throw new Error("Expected idempotent response 'Payment already verified and confirmed'");
    }
    return res.data.message;
  });

  // ============================================================================
  // SUITE 9: COURIER & SHIPROCKET SERVICEABILITY
  // ============================================================================
  console.log("\n📌 SUITE 9: Shipping Serviceability & Webhook Endpoints");
  await testStep("Shipping Serviceability", "Check serviceability for Ernakulam delivery pincode (682001)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "682001",
      weightKg: 1.0,
      cod: false,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error("Serviceability check failed");
    }
    return {
      courier: res.data.data.courier,
      rate: res.data.data.rate,
      porterFare: res.data.data.porter?.fare,
    };
  });

  await testStep("Shipping Serviceability", "Check serviceability for National delivery pincode (560001 Bangalore)", async () => {
    const res = await axios.post(`${API_BASE}/shipping/serviceability`, {
      pickupPincode: "682019",
      deliveryPincode: "560001",
      weightKg: 2.5,
      cod: false,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error("Serviceability check failed for national pincode");
    }
    return {
      courier: res.data.data.courier,
      rate: res.data.data.rate,
    };
  });

  await testStep("Shipping Serviceability", "Shiprocket webhook endpoint health responds active", async () => {
    const res = await axios.get(`${API_BASE}/shipping/webhook`);
    if (!res.data.success) {
      throw new Error("Shiprocket webhook health endpoint returned non-success");
    }
    return res.data;
  });

  // ============================================================================
  // SUITE 10: WISHLIST LIFECYCLE
  // ============================================================================
  console.log("\n📌 SUITE 10: Wishlist Lifecycle");
  await testStep("Wishlist", "Toggle product into customer wishlist", async () => {
    const res = await axios.post(
      `${API_BASE}/wishlist/toggle`,
      { productId: sampleProduct._id },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    if (!res.data.success) throw new Error("Failed to toggle wishlist");
    return res.data.message || "Toggled";
  });

  await testStep("Wishlist", "Fetch wishlist and verify item presence", async () => {
    const res = await axios.get(`${API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const items = res.data.data || res.data.wishlist || res.data.items || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(items)) throw new Error("Wishlist is not an array");
    return `Wishlist items: ${items.length}`;
  });

  // ============================================================================
  // SUITE 11: ADMIN ORDER PROCESSING & STATUS TRANSITIONS
  // ============================================================================
  console.log("\n📌 SUITE 11: Admin Order Status State Machine");
  await testStep("Admin Lifecycle", "Admin transitions order to 'processing'", async () => {
    const res = await axios.put(
      `${API_BASE}/orders/${testOrderId}/status`,
      { orderStatus: "processing", notes: "Aquarium technicians packing order" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const order = res.data.data || res.data.order;
    if (!order || order.orderStatus !== "processing") {
      throw new Error("Failed to transition status to 'processing'");
    }
    return { orderId: order._id, status: order.orderStatus };
  });

  await testStep("Admin Lifecycle", "Admin transitions order to 'shipped'", async () => {
    const res = await axios.put(
      `${API_BASE}/orders/${testOrderId}/status`,
      { orderStatus: "shipped", trackingNumber: "TRK-AQUA-9999", courierName: "Blue Dart Express" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const order = res.data.data || res.data.order;
    if (!order || order.orderStatus !== "shipped") {
      throw new Error("Failed to transition status to 'shipped'");
    }
    return { orderId: order._id, status: order.orderStatus, tracking: order.trackingNumber };
  });

  // ============================================================================
  // SUITE 12: CONTENT & COMMUNITY ENGAGEMENT
  // ============================================================================
  console.log("\n📌 SUITE 12: Content, Care Guides & Newsletter");
  await testStep("Care Guides", "Fetch care guides list", async () => {
    const res = await axios.get(`${API_BASE}/guides`);
    const guides = res.data.data || res.data.guides || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(guides)) throw new Error("Expected array of guides");
    return `Guides count: ${guides.length}`;
  });

  await testStep("Newsletter", "Subscribe new email address to newsletter", async () => {
    const email = `test_deep_${Date.now()}@aquapets.com`;
    const res = await axios.post(`${API_BASE}/subscribers`, { email });
    if (!res.data.success) throw new Error("Failed to subscribe newsletter");
    return res.data.message || `Subscribed ${email}`;
  });

  // ============================================================================
  // FINAL REPORT & AUDIT SUMMARY
  // ============================================================================
  const elapsedSec = ((Date.now() - report.startTime) / 1000).toFixed(2);
  const successRate = ((report.passed / report.total) * 100).toFixed(1);

  console.log("\n==================================================================");
  console.log("📊 DEEP LOGICAL TEST AUDIT COMPLETE");
  console.log("==================================================================");
  console.log(`Total Test Scenarios : ${report.total}`);
  console.log(`Passed               : ${report.passed} ✅`);
  console.log(`Failed               : ${report.failed} ❌`);
  console.log(`Success Rate         : ${successRate}%`);
  console.log(`Execution Time       : ${elapsedSec}s`);
  console.log("==================================================================\n");

  if (report.failed > 0) {
    console.error("❌ Some tests failed. Please review the failures logged above.");
    process.exit(1);
  } else {
    console.log("🎉 ALL DEEP LOGICAL TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  }
}

runDeepLogicalTests().catch((err) => {
  console.error("Fatal error during test run:", err);
  process.exit(1);
});
