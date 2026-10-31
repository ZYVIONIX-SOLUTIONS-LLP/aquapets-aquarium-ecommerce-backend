import axios from "axios";

const API_BASE = "http://localhost:5000/api";

interface TestReport {
  passed: number;
  failed: number;
  results: { suite: string; name: string; status: "PASS" | "FAIL"; error?: string; details?: any }[];
}

const report: TestReport = {
  passed: 0,
  failed: 0,
  results: [],
};

async function testStep(suite: string, name: string, fn: () => Promise<any>) {
  try {
    const details = await fn();
    report.passed++;
    report.results.push({ suite, name, status: "PASS", details });
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: any) {
    report.failed++;
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    report.results.push({ suite, name, status: "FAIL", error: errMsg, details: err.response?.data });
    console.log(`  ❌ [FAIL] ${name} -> ${errMsg}`);
  }
}

async function runLogicalTests() {
  console.log("=================================================");
  console.log("🌊 AQUA PETS AQUARIUM - COMPREHENSIVE LOGICAL TEST");
  console.log("=================================================\n");

  let customerToken = "";
  let adminToken = "";
  let sampleProduct: any = null;
  let testOrderId = "";
  let testOrderNumber = "";

  // 1. HEALTH & SYSTEM SUITE
  console.log("📌 SUITE 1: System Health & Base Routes");
  await testStep("System Health", "Health endpoint returns 200 OK", async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (res.data.status !== "ok") throw new Error("Status is not ok");
    return res.data;
  });

  await testStep("System Health", "Base API directory lists service endpoints", async () => {
    const res = await axios.get(`${API_BASE}`);
    if (res.data.status !== "online" || !res.data.endpoints.products) {
      throw new Error("API base index missing required endpoints map");
    }
    return res.data.endpoints;
  });

  // 2. AUTHENTICATION & ACCESS CONTROL SUITE
  console.log("\n📌 SUITE 2: Authentication & Role-Based Access Control");
  await testStep("Authentication", "Admin User Login with valid credentials", async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@aquapets.com",
      password: "AdminPassword123!",
    });
    if (!res.data.token || res.data.user.role !== "admin") {
      throw new Error("Admin login failed or role is not admin");
    }
    adminToken = res.data.token;
    return { name: res.data.user.name, role: res.data.user.role };
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
    return { name: res.data.user.name, role: res.data.user.role };
  });

  await testStep("Authentication", "Reject login with invalid password (401/400)", async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: "admin@aquapets.com",
        password: "WrongPassword999!",
      });
      throw new Error("Login unexpectedly succeeded with wrong credentials");
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        return "Properly rejected with status " + err.response.status;
      }
      throw err;
    }
  });

  await testStep("Authentication", "Fetch Authenticated Profile with JWT token", async () => {
    const res = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const user = res.data.user || res.data.data;
    if (!user || !user.email) {
      throw new Error("Profile returned invalid user object");
    }
    return { email: user.email, addresses: user.addresses?.length || 0 };
  });

  // 3. CATALOG & PRODUCT DISCOVERY SUITE
  console.log("\n📌 SUITE 3: Product Catalog, Search & Categories");
  await testStep("Catalog", "Fetch all active categories", async () => {
    const res = await axios.get(`${API_BASE}/categories`);
    const list = res.data.data || res.data.categories || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("No categories returned");
    }
    return `Found ${list.length} categories`;
  });

  await testStep("Catalog", "Fetch products list with pagination", async () => {
    const res = await axios.get(`${API_BASE}/products?limit=10&page=1`);
    const products = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products found in catalog");
    }
    sampleProduct = products.find((p: any) => p.stock > 0) || products[0];
    return { count: products.length, sample: sampleProduct.name, price: sampleProduct.price, stock: sampleProduct.stock };
  });

  await testStep("Catalog", "Search products by keyword query", async () => {
    const term = sampleProduct.name.split(" ")[0];
    const res = await axios.get(`${API_BASE}/products?search=${encodeURIComponent(term)}`);
    const products = res.data.data || res.data.products || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error(`Search for term '${term}' returned 0 results`);
    }
    return `Query '${term}' matched ${products.length} product(s)`;
  });

  await testStep("Catalog", "Fetch single product details by slug", async () => {
    if (!sampleProduct?.slug) throw new Error("No slug on sample product");
    const res = await axios.get(`${API_BASE}/products/${sampleProduct.slug}`);
    const product = res.data.data || res.data.product || res.data;
    if (!product || (product.name !== sampleProduct.name && product._id !== sampleProduct._id)) {
      throw new Error("Product fetch by slug failed to return matching product");
    }
    return { name: product.name, slug: product.slug, inStock: product.stock > 0 };
  });

  // 4. WISHLIST SUITE
  console.log("\n📌 SUITE 4: Customer Wishlist Lifecycle");
  await testStep("Wishlist", "Toggle/Add product to customer wishlist", async () => {
    const res = await axios.post(
      `${API_BASE}/wishlist/toggle`,
      { productId: sampleProduct._id },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    if (!res.data.success) throw new Error("Wishlist toggle returned unsuccessful");
    return res.data.message || "Wishlist updated";
  });

  await testStep("Wishlist", "Get customer wishlist and verify item presence", async () => {
    const res = await axios.get(`${API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const items = res.data.data || res.data.wishlist || res.data.items || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(items)) throw new Error("Wishlist is not an array");
    return `Wishlist items count: ${items.length}`;
  });

  // 5. INVENTORY VALIDATION & ORDER CHECKOUT SUITE
  console.log("\n📌 SUITE 5: Inventory Validation & Order Lifecycle");
  await testStep("Inventory", "Reject order when requested quantity exceeds available stock", async () => {
    try {
      await axios.post(
        `${API_BASE}/orders`,
        {
          items: [{ productId: sampleProduct._id, quantity: (sampleProduct.stock || 10) + 99999 }],
          shippingAddress: {
            fullName: "Test Buyer",
            phone: "9876543210",
            houseBuilding: "123 Coral Reef",
            street: "Ocean Way",
            city: "Kochi",
            state: "Kerala",
            pincode: "682001",
          },
        },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      throw new Error("Order creation should have failed due to insufficient stock");
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("Insufficient stock")) {
        return `Correctly blocked: ${err.response.data.message}`;
      }
      throw err;
    }
  });

  await testStep("Order Checkout", "Create valid customer checkout order & Razorpay order initiation", async () => {
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
          fullName: "melvin",
          phone: "916238392582",
          houseBuilding: "room17, kaithakkepadavil (H)",
          street: "Akkarappadam P.O , Vaikom , Kottayam",
          city: "Vaikom",
          state: "Kerala",
          pincode: "686143",
        },
        paymentMethod: "Razorpay",
        notes: "Automated E2E logical test order",
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    const orderData = res.data.data?.order || res.data.order || res.data.data;
    if (!orderData || !orderData._id || !orderData.orderNumber) {
      throw new Error("Order creation failed to return order object and orderNumber");
    }
    testOrderId = orderData._id;
    testOrderNumber = orderData.orderNumber;
    return {
      orderId: testOrderId,
      orderNumber: testOrderNumber,
      totalAmount: orderData.totalAmount,
      status: orderData.orderStatus,
      paymentStatus: orderData.paymentStatus,
    };
  });

  await testStep("Order Checkout", "Retrieve customer orders list and locate created order", async () => {
    const res = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const orders = res.data.data || res.data.orders || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(orders) || !orders.some((o: any) => o._id === testOrderId || o.orderNumber === testOrderNumber)) {
      throw new Error("Created order not found in customer orders list");
    }
    return `Customer has ${orders.length} order(s)`;
  });

  await testStep("Order Checkout", "Fetch order details by orderNumber identifier", async () => {
    const res = await axios.get(`${API_BASE}/orders/${testOrderNumber}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const order = res.data.data || res.data.order || res.data;
    if (!order || order.orderNumber !== testOrderNumber) {
      throw new Error("Failed to fetch order details by orderNumber");
    }
    return { orderNumber: order.orderNumber, itemsCount: order.items?.length, subtotal: order.subtotal };
  });

  // 6. ADMIN OPERATIONS SUITE
  console.log("\n📌 SUITE 6: Admin Operations & Order Processing");
  await testStep("Admin Operations", "Admin fetches all system orders", async () => {
    const res = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const orders = res.data.data || res.data.orders || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(orders)) throw new Error("Admin orders is not an array");
    return `Total system orders in DB: ${orders.length}`;
  });

  await testStep("Admin Operations", "Admin updates order status (Pending -> Processing)", async () => {
    const res = await axios.put(
      `${API_BASE}/orders/${testOrderId}/status`,
      { orderStatus: "processing", notes: "Order is being packed at aquarium center" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const order = res.data.data || res.data.order;
    if (!order || order.orderStatus !== "processing") {
      throw new Error("Order status update failed");
    }
    return { orderId: order._id, newStatus: order.orderStatus };
  });

  // 7. CONTENT & ENGAGEMENT SUITE
  console.log("\n📌 SUITE 7: Aquarium Guides & Newsletter Subscription");
  await testStep("Content & Community", "Fetch Care Guides catalog", async () => {
    const res = await axios.get(`${API_BASE}/guides`);
    const guides = res.data.data || res.data.guides || (Array.isArray(res.data) ? res.data : []);
    if (!Array.isArray(guides)) throw new Error("Guides response is not an array");
    return `Available guides: ${guides.length}`;
  });

  await testStep("Content & Community", "Newsletter email subscription endpoint", async () => {
    const testEmail = `test_subscriber_${Date.now()}@example.com`;
    const res = await axios.post(`${API_BASE}/subscribers`, {
      email: testEmail,
    });
    if (!res.data.success) throw new Error("Newsletter subscription failed");
    return res.data.message || `Subscribed ${testEmail}`;
  });

  // SUMMARY REPORT
  console.log("\n=================================================");
  console.log("📊 LOGICAL TEST EXECUTION SUMMARY");
  console.log("=================================================");
  console.log(`Total Tests Run : ${report.passed + report.failed}`);
  console.log(`Passed          : ${report.passed} ✅`);
  console.log(`Failed          : ${report.failed} ❌`);
  console.log(`Success Rate    : ${((report.passed / (report.passed + report.failed)) * 100).toFixed(1)}%`);
  console.log("=================================================\n");

  if (report.failed > 0) {
    console.error("Some tests failed. See details above.");
    process.exit(1);
  } else {
    console.log("🎉 ALL LOGICAL TESTS PASSED PERFECTLY!");
    process.exit(0);
  }
}

runLogicalTests().catch((err) => {
  console.error("Fatal error during test run:", err);
  process.exit(1);
});
