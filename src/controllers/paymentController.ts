import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { AuthRequest } from "../middleware/auth.js";
import { RazorpayService } from "../services/razorpayService.js";
import { ShiprocketService } from "../services/shiprocketService.js";
import { sendShopOwnerNotification, sendCustomerNotification } from "../services/whatsappService.js";
import { config } from "../config/env.js";

/**
 * 1. POST /api/payment/create-order
 * Validates products & prices on server, creates MongoDB Order with PENDING status,
 * creates Razorpay Order, and returns Razorpay checkout details.
 */
export const createPaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to your account to place an order.",
      });
      return;
    }

    const { items, shippingAddress, deliveryMethod, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Cart must contain at least one product" });
      return;
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
      res.status(400).json({ success: false, message: "Complete shipping address and contact details are required" });
      return;
    }

    // SERVER-SIDE VALIDATION & PRICE RECALCULATION
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const rawId = item.productId || item._id || item.product?.id || item.product?._id;
      const slug = item.slug || item.product?.slug;
      const itemName = item.name || item.product?.name;

      let product = null;
      if (rawId && typeof rawId === "string" && rawId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(rawId);
      }
      if (!product && slug) {
        product = await Product.findOne({ slug: String(slug).trim() });
      }
      if (!product && rawId && typeof rawId === "string") {
        product = await Product.findOne({ slug: rawId.trim() });
      }
      if (!product && itemName) {
        product = await Product.findOne({
          $or: [
            { name: itemName.trim() },
            { name: new RegExp(`^${itemName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
          ],
        });
      }

      if (!product) {
        res.status(400).json({ success: false, message: `Product not found in catalog: ${itemName || rawId}` });
        return;
      }

      const requestedQty = Math.max(1, parseInt(item.quantity || 1, 10));

      if (product.stock < requestedQty) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${requestedQty}`,
        });
        return;
      }

      const serverPrice = product.price || 0;
      const itemSubtotal = serverPrice * requestedQty;
      subtotal += itemSubtotal;

      verifiedItems.push({
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: (product.images && product.images.length > 0 && product.images[0]) ? product.images[0] : "",
        price: serverPrice,
        quantity: requestedQty,
        selectedVariant: item.selectedVariant || "",
        weightKg: product.weightKg || 0.5,
      });
    }

    const totalWeightKg = verifiedItems.reduce(
      (sum, item) => sum + (Number(item.weightKg) || 0.5) * item.quantity,
      0
    );

    let deliveryFee = 0;
    if (deliveryMethod === "porter") {
      // Porter delivery is handled manually by store team; charges are extra (payable directly on delivery)
      deliveryFee = 0;
    } else {
      // Standard Courier: All orders charged via Shiprocket rate (or weight-tiered fallback)
      if (typeof req.body.deliveryFee === "number" && req.body.deliveryFee > 0) {
        deliveryFee = Math.round(req.body.deliveryFee);
      } else if (totalWeightKg <= 0.5) {
        deliveryFee = 60;
      } else if (totalWeightKg <= 1.0) {
        deliveryFee = 90;
      } else {
        deliveryFee = Math.round(90 + Math.ceil(totalWeightKg - 1.0) * 45);
      }
    }
    const discount = 0;
    const total = subtotal + deliveryFee - discount;
    const totalAmount = total;

    const orderNumber = `AQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create MongoDB Order with PENDING status
    const order = await Order.create({
      orderNumber,
      userId: req.user ? req.user._id : undefined,
      items: verifiedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        email: shippingAddress.email ? shippingAddress.email.trim() : "",
        phone: shippingAddress.phone.trim(),
        houseBuilding: shippingAddress.houseBuilding || shippingAddress.house || "",
        street: shippingAddress.street || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        pincode: shippingAddress.pincode || "",
      },
      subtotal,
      deliveryFee,
      discount,
      total,
      totalAmount,
      paymentMethod: "Razorpay",
      paymentStatus: "PENDING",
      orderStatus: "CREATED",
      notes: notes || (deliveryMethod === "porter" ? "Porter Express (Delivery charges extra / pay on delivery)" : "Standard Courier"),
    });

    // Create Razorpay Order with amount in paise
    let razorpayOrder;
    try {
      razorpayOrder = await RazorpayService.createOrder(total, order.orderNumber, {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      });

      // Update Order with razorpayOrderId
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      // Create tracking Payment record
      await Payment.create({
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        currency: "INR",
        status: "created",
      });
    } catch (rzpErr: any) {
      console.error("Razorpay Order Creation Error:", rzpErr);
      res.status(500).json({
        success: false,
        message: "Failed to create payment order with Razorpay. Please check gateway configuration.",
        error: rzpErr.message,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "Payment order initialized",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        isLiveRazorpayOrder: Boolean((razorpayOrder as any).isLive),
        amount: razorpayOrder.amount, // in paise
        amountInRupees: total,
        currency: "INR",
        keyId: config.razorpay.keyId,
        customer: {
          name: order.shippingAddress.fullName,
          email: order.shippingAddress.email,
          contact: order.shippingAddress.phone,
        },
        items: verifiedItems,
        total: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/payment/verify
 * Server-side HMAC SHA256 signature verification.
 * Marks paymentStatus = 'PAID' and orderStatus = 'CONFIRMED'.
 * Triggers inventory decrement and WhatsApp confirmation alert.
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpayOrderId = razorpay_order_id,
      razorpay_payment_id,
      razorpayPaymentId = razorpay_payment_id,
      razorpay_signature,
      razorpaySignature = razorpay_signature,
      orderId,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({
        success: false,
        message: "Missing Razorpay payment verification parameters (order_id, payment_id, signature)",
      });
      return;
    }

    // Find target order
    let order = null;
    if (orderId && typeof orderId === "string" && orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ razorpayOrderId });
    }

    if (!order) {
      res.status(404).json({ success: false, message: "Matching order not found in database" });
      return;
    }

    // Idempotency: If already marked PAID, return existing order safely
    if (order.paymentStatus === "PAID" || order.paymentStatus === "Paid") {
      res.json({
        success: true,
        message: "Payment already verified and confirmed",
        data: { order },
      });
      return;
    }

    // Perform Server-Side HMAC-SHA256 Signature Verification
    const isValid = RazorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    const payment = await Payment.findOne({ razorpayOrderId });

    if (!isValid) {
      order.paymentStatus = "FAILED";
      await order.save();

      if (payment) {
        payment.status = "failed";
        payment.failureReason = "Signature mismatch";
        await payment.save();
      }

      res.status(400).json({ success: false, message: "Payment verification failed: invalid signature" });
      return;
    }

    // Update Order to PAID & CONFIRMED
    order.paymentStatus = "PAID";
    order.orderStatus = "CONFIRMED";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // Update Payment Record
    if (payment) {
      payment.status = "captured";
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      await payment.save();
    }

    // Decrement product inventory safely
    for (const item of order.items) {
      try {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      } catch (stockErr) {
        console.warn(`Could not update stock for product ${item.productId}:`, stockErr);
      }
    }

    // Automatically push Courier orders to Shiprocket upon confirmed payment
    if (order.deliveryMethod !== "porter") {
      try {
        const orderItems = order.items.map((item) => ({
          name: item.name,
          sku: item.slug || item.productId.toString(),
          units: item.quantity,
          selling_price: item.price,
        }));

        const totalWeight = order.items.reduce(
          (sum, item) => sum + (item.weightKg || 0.5) * item.quantity,
          0
        );

        const shiprocketResponse = await ShiprocketService.createOrder({
          order_id: order.orderNumber,
          order_date: new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19),
          billing_customer_name: order.shippingAddress.fullName,
          billing_address: `${order.shippingAddress.houseBuilding || ""}, ${order.shippingAddress.street || ""}`.trim() || order.shippingAddress.city || "Kerala",
          billing_city: order.shippingAddress.city || "Kochi",
          billing_pincode: order.shippingAddress.pincode,
          billing_state: order.shippingAddress.state || "Kerala",
          billing_email: order.shippingAddress.email || "customer@aquapets.in",
          billing_phone: order.shippingAddress.phone,
          shipping_is_billing: true,
          order_items: orderItems,
          payment_method: "Prepaid",
          sub_total: order.total,
          weight: totalWeight || 0.5,
        });

        if (shiprocketResponse && shiprocketResponse.order_id) {
          order.shiprocket.orderId = shiprocketResponse.order_id;
          order.shiprocket.shipmentId = shiprocketResponse.shipment_id;
          order.shiprocket.status = shiprocketResponse.status || "PROCESSING";
          await order.save();
          console.log(`✅ Order ${order.orderNumber} successfully pushed to Shiprocket (ID: ${shiprocketResponse.order_id})`);
        }
      } catch (srErr: any) {
        console.warn("⚠️ Shiprocket auto-sync notice:", srErr.response?.data?.message || srErr.message);
      }
    }

    // Send automated WhatsApp notifications to shop owner and customer
    try {
      const waPayload = {
        orderNumber: order.orderNumber,
        customerName: order.shippingAddress.fullName,
        customerPhone: order.shippingAddress.phone,
        shippingAddress: order.shippingAddress,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: `Razorpay (Paid #${razorpayPaymentId})`,
        deliveryMethod: order.deliveryMethod,
        notes: order.notes,
      };
      await Promise.allSettled([
        sendShopOwnerNotification(waPayload),
        sendCustomerNotification(waPayload),
      ]);
    } catch (waErr) {
      console.warn("WhatsApp notification error:", waErr);
    }

    res.json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      data: {
        order,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/payment/webhook
 * Razorpay automated Webhook handler.
 * Handles background payment confirmation if customer's browser disconnected.
 */
export const handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    if (process.env.NODE_ENV === "production" && !webhookSignature) {
      res.status(401).json({ success: false, message: "Missing Razorpay webhook signature" });
      return;
    }

    if (webhookSignature) {
      const isValid = RazorpayService.verifyWebhookSignature(rawBody, webhookSignature);
      if (!isValid) {
        res.status(400).json({ success: false, message: "Invalid webhook signature" });
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment ? payload.payment.entity : null;
      const rzpOrderId = paymentEntity ? paymentEntity.order_id : payload.order?.entity?.id;
      const rzpPaymentId = paymentEntity ? paymentEntity.id : undefined;

      if (rzpOrderId) {
        const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (order && order.paymentStatus !== "PAID" && order.paymentStatus !== "Paid") {
          order.paymentStatus = "PAID";
          order.orderStatus = "CONFIRMED";
          if (rzpPaymentId) order.razorpayPaymentId = rzpPaymentId;
          await order.save();

          // Decrement stock
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.quantity },
            });
          }

          // WhatsApp alerts to shop owner and customer
          const waPayload = {
            orderNumber: order.orderNumber,
            customerName: order.shippingAddress.fullName,
            customerPhone: order.shippingAddress.phone,
            shippingAddress: order.shippingAddress,
            items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
            total: order.total,
            paymentMethod: `Razorpay Webhook (Paid #${rzpPaymentId || ""})`,
            deliveryMethod: order.deliveryMethod,
            notes: order.notes,
          };
          await Promise.allSettled([
            sendShopOwnerNotification(waPayload),
            sendCustomerNotification(waPayload),
          ]);
        }
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/payment/status/:orderId
 * Returns current payment & order status for polling / reconnection recovery.
 */
export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [
        { _id: typeof orderId === "string" && orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
        { orderNumber: orderId },
        { razorpayOrderId: orderId },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        total: order.total,
        items: order.items,
        shippingAddress: order.shippingAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};
