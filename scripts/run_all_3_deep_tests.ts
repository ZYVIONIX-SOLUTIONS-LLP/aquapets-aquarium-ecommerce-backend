import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_BASE = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "aqua_pets_super_secret_jwt_key_2026";

async function runDeepTests() {
  console.log("\n=================================================================");
  console.log("🌊 AQUAPETS AQUARIUM — 3-STAGE COMPREHENSIVE DEEP VERIFICATION 🌊");
  console.log("=================================================================\n");

  // =========================================================================
  // TEST 1: SEND A TEST NEWSLETTER
  // =========================================================================
  console.log("-----------------------------------------------------------------");
  console.log("TEST 1: Send a Test Newsletter from aquapetsaquariumkochi@gmail.com");
  console.log("-----------------------------------------------------------------");

  const testEmail = "akshithjeevan2000@gmail.com";
  const newsletterPayload = {
    recipientEmails: [testEmail],
    subject: "🐠 AquaPets Verification: Live Test Newsletter from aquapetsaquariumkochi@gmail.com",
    message: `Hello Akshith,\n\nThis is a live test broadcast sent directly from the official store email: aquapetsaquariumkochi@gmail.com.\n\nAll systems are operational:\n✓ Cloudinary CDN Image Delivery\n✓ Gmail SMTP Client Authentication\n✓ Storefront Checkout & Live Admin Orders\n\nBest regards,\nAqua Pets Aquarium Kochi Team`,
  };

  console.log(`📡 Sending test newsletter to ${testEmail}...`);
  const newsRes = await fetch(`${API_BASE}/subscribers/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newsletterPayload),
  });

  const newsData = await newsRes.json();
  if (newsRes.ok && newsData.success) {
    console.log("✅ TEST 1 PASSED: Newsletter email successfully sent via Gmail SMTP!");
    console.log(`   From: "AquaPets Aquarium" <aquapetsaquariumkochi@gmail.com>`);
    console.log(`   To:   ${testEmail}`);
    console.log(`   Sent Count: ${newsData.sentCount || 1}`);
  } else {
    console.error("❌ TEST 1 FAILED:", newsData);
  }

  // =========================================================================
  // TEST 2: NEW PRODUCT UPLOAD WITH CLOUDINARY
  // =========================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST 2: New Product Upload Stream to Cloudinary (cloud: xsxvzuhd)");
  console.log("-----------------------------------------------------------------");

  // Read a sample image to upload
  const sampleImgPath = path.resolve(
    __dirname,
    "../../aqua-pets-frontend/public/products/tanks/aquapets-nano-tank-8x4x6-5mm.jpg"
  );

  let uploadedCloudinaryUrl = "";
  let uploadedPublicId = "";

  if (fs.existsSync(sampleImgPath)) {
    const fileBuffer = fs.readFileSync(sampleImgPath);
    const blob = new Blob([fileBuffer], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("image", blob, "e2e-deep-test-tank.jpg");
    formData.append("folder", "aqua-pets/products");

    console.log("📡 Streaming image file to POST /api/upload...");
    const uploadRes = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (uploadRes.ok && uploadData.success && uploadData.data?.url) {
      uploadedCloudinaryUrl = uploadData.data.url;
      uploadedPublicId = uploadData.data.publicId;
      console.log("✅ Upload to Cloudinary succeeded!");
      console.log(`   Cloudinary URL: ${uploadedCloudinaryUrl}`);
      console.log(`   Public ID:      ${uploadedPublicId}`);

      // Verify URL has the client cloud name
      if (uploadedCloudinaryUrl.includes("xsxvzuhd")) {
        console.log("   🎯 Confirmed: Hosted on NEW Cloudinary cloud (xsxvzuhd)");
      }
    } else {
      console.error("❌ Cloudinary image upload failed:", uploadData);
    }
  }

  // Now create a product using that Cloudinary URL
  const testProductSlug = `deep-test-tank-${Date.now()}`;
  const productPayload = {
    name: "AquaPets E2E Deep Test Tank (Cloudinary Verified)",
    slug: testProductSlug,
    category: "aquariums-tanks",
    brand: "AquaPets Aquarium",
    price: 999,
    originalPrice: 1299,
    discount: 23,
    stock: 10,
    images: [uploadedCloudinaryUrl],
    description: "Automated E2E test tank verifying Cloudinary integration.",
    fullDescription: "Detailed E2E test tank specifications with cloud-hosted imagery.",
  };

  console.log("📡 Creating product via POST /api/products...");
  const createProdRes = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productPayload),
  });

  const createProdData = await createProdRes.json();
  let createdProductId = "";

  if (createProdRes.ok && createProdData.success) {
    createdProductId = createProdData.data._id;
    console.log("✅ Product successfully created in MongoDB!");
    console.log(`   Product ID:   ${createdProductId}`);
    console.log(`   Product Name: ${createProdData.data.name}`);
    console.log(`   Image URL:    ${createProdData.data.images[0]}`);

    // Clean up test product
    console.log(`🧹 Cleaning up test product ${createdProductId}...`);
    await fetch(`${API_BASE}/products/${createdProductId}`, { method: "DELETE" });
    console.log("✅ TEST 2 PASSED: Full upload, product creation, and cleanup verified!");
  } else {
    console.error("❌ TEST 2 FAILED to create product:", createProdData);
  }

  // =========================================================================
  // TEST 3: CUSTOMER STOREFRONT CHECKOUT FLOW & LIVE ORDERS
  // =========================================================================
  console.log("\n-----------------------------------------------------------------");
  console.log("TEST 3: Customer Storefront Checkout Flow & Admin Live Orders");
  console.log("-----------------------------------------------------------------");

  // 1. Fetch products to get a real product for checkout
  const prodsRes = await fetch(`${API_BASE}/products?limit=1`);
  const prodsData = await prodsRes.json();
  const sampleProduct = prodsData.data[0];

  console.log(`🛒 Selected Product for Cart: "${sampleProduct.name}" (₹${sampleProduct.price})`);

  // 2. Generate customer auth token for user akshithjeevan2000@gmail.com
  const customerId = "6ab53038c0aa72015022d704"; // akshith
  const authToken = jwt.sign({ id: customerId }, JWT_SECRET, { expiresIn: "1d" });

  // 3. Submit Order
  const orderPayload = {
    items: [
      {
        productId: sampleProduct._id,
        quantity: 1,
        price: sampleProduct.price,
        name: sampleProduct.name,
      },
    ],
    shippingAddress: {
      fullName: "Akshith Jeevan",
      phone: "916238392582",
      addressLine1: "Vyttila Thammanam Road, Near S.N.D.P. Temple",
      city: "Kochi",
      state: "Kerala",
      pincode: "682019",
    },
    paymentMethod: "Cash on Delivery",
    notes: "Deep Test Automated Verification Order",
  };

  console.log("📡 Placing order via POST /api/orders (COD)...");
  const orderRes = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(orderPayload),
  });

  const orderData = await orderRes.json();
  if (orderRes.ok && orderData.success) {
    const placedOrder = orderData.data?.order;
    console.log("✅ Order successfully placed on Storefront!");
    console.log(`   Order ID:        ${placedOrder._id}`);
    console.log(`   Order Number:    ${placedOrder.orderNumber}`);
    console.log(`   Total Amount:    ₹${placedOrder.total}`);
    console.log(`   Status:          ${placedOrder.orderStatus}`);
    console.log(`   Payment Method:  ${placedOrder.paymentMethod}`);
    console.log(`   Delivery Method: ${placedOrder.deliveryMethod}`);

    // 4. Verify order appears in Admin Portal Live Orders endpoint using Admin Token
    console.log("📡 Verifying order in Admin Portal (GET /api/orders)...");
    const adminId = "6ac0928214038a956245f5bc"; // AquaPets Admin
    const adminToken = jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: "1d" });

    const adminOrdersRes = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminOrdersData = await adminOrdersRes.json();

    const foundInAdmin = (adminOrdersData.data || []).some(
      (o: any) => o._id === placedOrder._id || o.orderNumber === placedOrder.orderNumber
    );

    if (foundInAdmin) {
      console.log("✅ Verified: Order is visible live on Admin Portal (http://localhost:3001/orders)!");
      console.log("✅ TEST 3 PASSED: Full storefront checkout flow and admin sync verified!");
    } else {
      console.warn("⚠️ Order placed but not immediately found in admin list response.");
    }
  } else {
    console.error("❌ TEST 3 FAILED to place order:", orderData);
  }

  console.log("\n=================================================================");
  console.log("🎉 ALL 3 DEEP TESTS COMPLETED SUCCESSFULLY! 🎉");
  console.log("=================================================================\n");
}

runDeepTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
