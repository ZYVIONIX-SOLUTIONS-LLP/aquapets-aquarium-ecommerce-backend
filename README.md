# Aqua Pets Aquarium - Backend API

Production-ready Node.js, Express, and TypeScript backend powered by MongoDB (Mongoose), Razorpay payment verification, and Shiprocket shipping lifecycle integration.

---

## 🏗️ Architecture

- **Runtime & Language**: Node.js, TypeScript (ES2022 / NodeNext modules)
- **Framework**: Express.js with Helmet, CORS, and Morgan logging
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & BCrypt for customer/admin access
- **Payment Gateway**: Razorpay (Order creation, HMAC-SHA256 signature verification, Webhooks)
- **Shipping Logistics**: Shiprocket API (Token auth caching, Courier serviceability, Shipment creation, AWB generation, Pickup requests, Live tracking)

---

## 🚀 Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aqua_pets_aquarium
JWT_SECRET=your_jwt_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Shiprocket
SHIPROCKET_EMAIL=...
SHIPROCKET_PASSWORD=...
SHIPROCKET_PICKUP_LOCATION=Primary
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Initial Data
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Server runs at `http://localhost:5000`.

---

## 📡 Key API Routes

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Customer sign up
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Authenticated user profile
- `POST /api/auth/address` - Add delivery address

### 🐟 Products & Categories (`/api/products`, `/api/categories`)
- `GET /api/products` - Filtered & paginated products query
- `GET /api/products/:slug` - Product details
- `POST /api/products` - Admin product creation
- `PUT /api/products/:id` - Admin product update
- `DELETE /api/products/:id` - Admin product deletion
- `GET /api/categories` - All categories

### 🛒 Orders (`/api/orders`)
- `POST /api/orders` - Place checkout order & initiate Razorpay payment
- `GET /api/orders` - Get customer/admin orders
- `GET /api/orders/:identifier` - Get order by ID or order number (`AQ-XXXXXX-XXX`)
- `PUT /api/orders/:id/status` - Update order or payment status

### 💳 Payments (`/api/payments`)
- `POST /api/payments/verify` - Verify Razorpay payment signature and mark order paid
- `POST /api/payments/webhook` - Async Razorpay webhook handler

### 📦 Shipping & Shiprocket (`/api/shipping`)
- `POST /api/shipping/serviceability` - Check courier delivery pincode & rates
- `POST /api/shipping/orders/:orderId/create-shipment` - Create Shiprocket order/shipment
- `POST /api/shipping/orders/:orderId/generate-awb` - Generate AWB code
- `POST /api/shipping/orders/:orderId/request-pickup` - Request warehouse pickup
- `GET /api/shipping/track/:awbOrOrderId` - Live tracking
- `POST /api/shipping/webhook` - Shiprocket tracking webhook
