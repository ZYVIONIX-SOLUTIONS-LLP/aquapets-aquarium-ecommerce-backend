import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { AuthRequest } from "../middleware/auth.js";
import { RazorpayService } from "../services/razorpayService.js";
import { sendShopOwnerNotification } from "../services/whatsappService.js";

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, paymentMethod = "Razorpay", notes } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: "Order must contain at least one item" });
      return;
    }

    if (!shippingAddress || !shippingAddress.pincode || !shippingAddress.phone) {
      res.status(400).json({ success: false, message: "Valid shipping address is required" });
      return;
    }

    // Calculate totals and verify items
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
        res.status(400).json({ success: false, message: `Product not found: ${itemName || rawId}` });
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
        return;
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] || "",
        price: product.price,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant,
        weightKg: product.weightKg || 0.5,
      });
    }

    const deliveryFee = subtotal >= 999 ? 0 : 99; // Free delivery over ₹999
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    const orderNumber = `AQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await Order.create({
      orderNumber,
      userId: req.user ? req.user._id : undefined,
      items: verifiedItems,
      shippingAddress,
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Placed",
      notes,
    });

    let razorpayOrder = null;
    if (paymentMethod === "Razorpay") {
      try {
        razorpayOrder = await RazorpayService.createOrder(total, order.orderNumber, {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        });

        await Payment.create({
          orderId: order._id,
          razorpayOrderId: razorpayOrder.id,
          amount: total,
          currency: "INR",
          status: "created",
        });
      } catch (err: any) {
        console.warn("⚠️ Razorpay order creation failed (Check credentials in .env):", err.message);
      }
    }

    // Generate & Dispatch Automated Shop Owner Notification (916238392582)
    const shopOwnerWhatsappUrl = await sendShopOwnerNotification({
      orderNumber: order.orderNumber,
      customerName: shippingAddress.fullName,
      customerPhone: shippingAddress.phone,
      shippingAddress,
      items: verifiedItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total,
      paymentMethod,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order,
        razorpayOrder,
        shopOwnerWhatsappUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: Record<string, any> = {};

    // If customer, only show their orders
    if (req.user && req.user.role !== "admin") {
      query.userId = req.user._id;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdOrNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const identifier = String(req.params.identifier);

    const order = await Order.findOne({
      $or: [{ _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }, { orderNumber: identifier }],
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const updateData: Record<string, any> = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
