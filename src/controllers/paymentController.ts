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

      if (product.isActive === false) {
        res.status(400).json({
          success: false,
          message: `'${product.name}' is currently unavailable/deactivated and cannot be purchased.`,
        });
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
 * Centralized, Idempotent Order Payment Confirmation Pipeline.
 * Safely executes:
 * 1. Status update to PAID & CONFIRMED
 * 2. Payment record update / creation
 * 3. Inventory deduction
 * 4. Shiprocket automated booking (for courier shipments)
 * 5. Customer & Shop Owner WhatsApp alerts
 * Guaranteed safe to call repeatedly (idempotent).
 */
export const processSuccessfulOrderPayment = async (
  order: any,
  details: {
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    source?: string;
  }
): Promise<{ success: boolean; order: any; alreadyPaid?: boolean }> => {
  // Idempotency: If already marked PAID, return existing order safely without duplicate stock deduction or Shiprocket push
  if (order.paymentStatus === "PAID" || order.paymentStatus === "Paid") {
    return { success: true, order, alreadyPaid: true };
  }

  // Update Order to PAID & CONFIRMED
  order.paymentStatus = "PAID";
  order.orderStatus = "CONFIRMED";
  if (details.razorpayPaymentId) order.razorpayPaymentId = details.razorpayPaymentId;
  if (details.razorpaySignature) order.razorpaySignature = details.razorpaySignature;
  await order.save();

  // Update or create tracking Payment record
  try {
    let payment = await Payment.findOne({
      $or: [
        { razorpayOrderId: order.razorpayOrderId },
        { orderId: order._id },
      ],
    });

    if (payment) {
      payment.status = "captured";
      if (details.razorpayPaymentId) payment.razorpayPaymentId = details.razorpayPaymentId;
      if (details.razorpaySignature) payment.razorpaySignature = details.razorpaySignature;
      await payment.save();
    } else {
      await Payment.create({
        orderId: order._id,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: details.razorpayPaymentId,
        razorpaySignature: details.razorpaySignature,
        amount: order.total,
        currency: "INR",
        status: "captured",
      });
    }
  } catch (payErr) {
    console.warn("⚠️ Payment record update warning:", payErr);
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
      const orderItems = order.items.map((item: any) => ({
        name: item.name,
        sku: item.slug || item.productId.toString(),
        units: item.quantity,
        selling_price: item.price,
      }));

      const totalWeight = order.items.reduce(
        (sum: number, item: any) => sum + (item.weightKg || 0.5) * item.quantity,
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
        order.shiprocket = order.shiprocket || {};
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
      items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: `Razorpay (${details.source || "Paid"} #${details.razorpayPaymentId || ""})`,
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

  return { success: true, order, alreadyPaid: false };
};

/**
 * Independently reconciles an order with Razorpay live API.
 * If Razorpay captured the payment, automatically executes the full confirmation pipeline.
 */
export const reconcileOrderWithRazorpay = async (
  order: any
): Promise<{
  isPaid: boolean;
  reconciled: boolean;
  order: any;
  paymentId?: string;
  razorpayStatus?: string;
  error?: string;
}> => {
  if (!order) {
    return { isPaid: false, reconciled: false, order: null, error: "Order not found" };
  }

  // If order is already paid, no reconciliation needed
  if (order.paymentStatus === "PAID" || order.paymentStatus === "Paid") {
    return { isPaid: true, reconciled: false, order };
  }

  if (!order.razorpayOrderId) {
    return { isPaid: false, reconciled: false, order, error: "No Razorpay Order ID on this order" };
  }

  // Query Razorpay API directly
  const statusCheck = await RazorpayService.checkOrderPaidStatus(order.razorpayOrderId);

  if (statusCheck.isPaid) {
    console.log(
      `🔔 [Razorpay Reconciliation] Order ${order.orderNumber} (${order.razorpayOrderId}) independently verified as PAID on Razorpay (Payment: ${statusCheck.paymentId}). Confirming order...`
    );

    const result = await processSuccessfulOrderPayment(order, {
      razorpayPaymentId: statusCheck.paymentId,
      source: "Razorpay Auto-Reconciled",
    });

    return {
      isPaid: true,
      reconciled: true,
      order: result.order,
      paymentId: statusCheck.paymentId,
      razorpayStatus: statusCheck.status,
    };
  }

  return {
    isPaid: false,
    reconciled: false,
    order,
    razorpayStatus: statusCheck.status || "unpaid",
  };
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

    if (!isValid) {
      // Before immediately marking FAILED, check Razorpay directly
      // In case client signature differed or test mock payload was used
      const rzpCheck = await RazorpayService.checkOrderPaidStatus(razorpayOrderId);
      if (!rzpCheck.isPaid) {
        order.paymentStatus = "FAILED";
        await order.save();

        const payment = await Payment.findOne({ razorpayOrderId });
        if (payment) {
          payment.status = "failed";
          payment.failureReason = "Signature mismatch";
          await payment.save();
        }

        res.status(400).json({ success: false, message: "Payment verification failed: invalid signature" });
        return;
      }
    }

    // Run unified confirmation pipeline
    const result = await processSuccessfulOrderPayment(order, {
      razorpayPaymentId,
      razorpaySignature,
      source: "Client Callback Verification",
    });

    const payment = await Payment.findOne({ razorpayOrderId });

    res.json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      data: {
        order: result.order,
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
        if (order) {
          await processSuccessfulOrderPayment(order, {
            razorpayPaymentId: rzpPaymentId,
            source: `Razorpay Webhook (${event})`,
          });
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
 * Independently reconciles with Razorpay live API if order is not marked PAID!
 */
export const getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    let order = await Order.findOne({
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

    // Auto-reconcile with Razorpay if order is not yet marked PAID and has a Razorpay Order ID!
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "Paid" && order.razorpayOrderId) {
      try {
        const reconciliation = await reconcileOrderWithRazorpay(order);
        if (reconciliation.isPaid && reconciliation.order) {
          order = reconciliation.order;
        }
      } catch (recErr) {
        console.warn("⚠️ Background reconciliation check error:", recErr);
      }
    }

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // Privacy & IDOR Protection:
    // If not authenticated as the order owner or admin, return only high-level status without sensitive address
    if (order.userId) {
      const isOwner = req.user && String(order.userId) === String(req.user._id);
      const isAdmin = req.user && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        res.json({
          success: true,
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
          },
        });
        return;
      }
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

/**
 * 5. POST /api/payment/reconcile/:orderId
 * On-demand endpoint to force-reconcile an order directly with Razorpay's API.
 * Can be called by Admin panel or client recovery flow.
 */
export const reconcilePaymentOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const result = await reconcileOrderWithRazorpay(order);

    res.json({
      success: true,
      message: result.isPaid
        ? (result.reconciled
            ? `Payment verified on Razorpay! Order ${order.orderNumber} marked as PAID and confirmed.`
            : `Order ${order.orderNumber} is already confirmed and marked as PAID.`)
        : `Razorpay check complete: No captured payment found for order ${order.orderNumber} (Razorpay status: ${result.razorpayStatus || "unpaid"}).`,
      data: {
        isPaid: result.isPaid,
        reconciled: result.reconciled,
        razorpayStatus: result.razorpayStatus,
        paymentId: result.paymentId,
        order: result.order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. POST /api/payment/reconcile-all
 * Batch reconciliation for all unpaid/abandoned orders.
 * Admin-only operation that sweeps recent unpaid orders and checks with Razorpay.
 */
export const reconcileAllAbandonedOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pendingOrders = await Order.find({
      paymentStatus: { $nin: ["PAID", "Paid"] },
      razorpayOrderId: { $exists: true, $ne: "" },
    }).sort({ createdAt: -1 }).limit(50);

    const results = [];
    let recoveredCount = 0;

    for (const order of pendingOrders) {
      try {
        const check = await reconcileOrderWithRazorpay(order);
        if (check.isPaid && check.reconciled) {
          recoveredCount++;
          results.push({
            orderNumber: order.orderNumber,
            recovered: true,
            paymentId: check.paymentId,
          });
        } else {
          results.push({
            orderNumber: order.orderNumber,
            recovered: false,
            razorpayStatus: check.razorpayStatus,
          });
        }
      } catch (err: any) {
        results.push({
          orderNumber: order.orderNumber,
          recovered: false,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Reconciliation complete: checked ${pendingOrders.length} orders, recovered ${recoveredCount} paid orders!`,
      data: {
        totalChecked: pendingOrders.length,
        recoveredCount,
        details: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Cancel or Abandon a Pending Payment Order
 */
export const cancelPendingOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

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

    // Ownership check (IDOR Protection):
    // Only the customer who created the order or a store admin can cancel it
    if (order.userId) {
      const isOwner = req.user && String(order.userId) === String(req.user._id);
      const isAdmin = req.user && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You do not have permission to modify this order",
        });
        return;
      }
    }

    // Only allow cancelling if still PENDING / CREATED
    if (order.paymentStatus === "PENDING" || order.paymentStatus === "Pending") {
      // Safety Check: Verify with Razorpay first before cancelling
      if (order.razorpayOrderId) {
        try {
          const check = await RazorpayService.checkOrderPaidStatus(order.razorpayOrderId);
          if (check.isPaid) {
            await processSuccessfulOrderPayment(order, {
              razorpayPaymentId: check.paymentId,
              source: "Cancel Request Reconcile Guard",
            });
            res.json({
              success: true,
              message: "Payment was captured on Razorpay! Order confirmed instead of cancelled.",
              data: { orderId: order._id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus },
            });
            return;
          }
        } catch (guardErr) {
          console.warn("⚠️ Razorpay cancel guard error:", guardErr);
        }
      }

      order.paymentStatus = "FAILED";
      order.orderStatus = "CANCELLED";
      await order.save();
    }

    res.json({
      success: true,
      message: "Order marked as cancelled/abandoned",
      data: { orderId: order._id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus },
    });
  } catch (error) {
    next(error);
  }
};
