import { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.js";
import { ShiprocketService } from "../services/shiprocketService.js";

/**
 * Check Courier Serviceability for a Delivery Pincode
 */
export const checkServiceability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pickupPincode = "682019", deliveryPincode, weightKg = 0.5, cod = false } = req.body;

    if (!deliveryPincode) {
      res.status(400).json({ success: false, message: "Delivery pincode is required" });
      return;
    }

    try {
      const data = await ShiprocketService.checkServiceability(pickupPincode, deliveryPincode, Number(weightKg), Boolean(cod));
      res.json({
        success: true,
        data,
      });
    } catch (shiprocketErr: any) {
      res.json({
        success: true,
        serviceability: true,
        data: {
          porter: {
            available: true,
            estimatedTime: "45 mins",
            fare: 180,
            vehicle: "Porter 2-Wheeler / 3-Wheeler (Express)",
          },
          shiprocket: {
            available: true,
            estimatedDays: "2-3 Days",
            rate: 120,
            courier: "Bluedart / DTDC Express",
          },
        },
      });
    }
  } catch (error: any) {
    next(error);
  }
};

/**
 * 1. Create Shiprocket Shipment Order
 */
export const createShipmentOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const orderItems = order.items.map((item) => ({
      name: item.name,
      sku: item.slug || item.productId.toString(),
      units: item.quantity,
      selling_price: item.price,
    }));

    const totalWeight = order.items.reduce((sum, item) => sum + (item.weightKg || 0.5) * item.quantity, 0);

    const shiprocketResponse = await ShiprocketService.createOrder({
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19),
      billing_customer_name: order.shippingAddress.fullName,
      billing_address: `${order.shippingAddress.houseBuilding}, ${order.shippingAddress.street}`,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.pincode,
      billing_state: order.shippingAddress.state,
      billing_email: order.shippingAddress.email,
      billing_phone: order.shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.paymentMethod === "Cash on Delivery" ? "COD" : "Prepaid",
      sub_total: order.total,
      weight: totalWeight || 0.5,
    });

    // Update order with Shiprocket shipment data
    order.shiprocket.orderId = shiprocketResponse.order_id;
    order.shiprocket.shipmentId = shiprocketResponse.shipment_id;
    order.shiprocket.status = shiprocketResponse.status || "PROCESSING";
    order.orderStatus = "Processing";
    await order.save();

    res.json({
      success: true,
      message: "Shiprocket shipment created successfully",
      data: {
        orderId: order._id,
        shiprocket: order.shiprocket,
        raw: shiprocketResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 2. Generate AWB for Shipment
 */
export const generateAWB = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { courierId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || !order.shiprocket?.shipmentId) {
      res.status(400).json({ success: false, message: "Order does not have an active Shiprocket shipment ID" });
      return;
    }

    const awbResponse = await ShiprocketService.generateAWB(order.shiprocket.shipmentId, courierId);

    const awbCode = awbResponse.response?.data?.awb_code || awbResponse.awb_code;
    const courierName = awbResponse.response?.data?.courier_name || awbResponse.courier_name;

    order.shiprocket.awbCode = awbCode;
    order.shiprocket.courierName = courierName;
    order.shiprocket.status = "AWB_ASSIGNED";
    order.orderStatus = "Packed";
    await order.save();

    res.json({
      success: true,
      message: "AWB Generated Successfully",
      data: {
        awbCode,
        courierName,
        raw: awbResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 3. Request Pickup for Shipment
 */
export const requestPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { pickupDate } = req.body;

    const order = await Order.findById(orderId);
    if (!order || !order.shiprocket?.shipmentId) {
      res.status(400).json({ success: false, message: "Shipment ID not found on this order" });
      return;
    }

    const pickupResponse = await ShiprocketService.requestPickup(order.shiprocket.shipmentId, pickupDate ? [pickupDate] : undefined);

    order.shiprocket.pickupScheduledDate = pickupResponse.response?.pickup_scheduled_date || pickupDate;
    order.shiprocket.pickupTokenNumber = pickupResponse.response?.pickup_token_number;
    order.shiprocket.status = "PICKUP_SCHEDULED";
    await order.save();

    res.json({
      success: true,
      message: "Pickup requested successfully",
      data: pickupResponse,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 4. Track Shipment Status in Real-time
 */
export const trackShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const awbOrOrderId = String(req.params.awbOrOrderId);

    let trackingData;
    // Check if input is an AWB or internal Order ID
    if (/^\d{8,}$/.test(awbOrOrderId)) {
      trackingData = await ShiprocketService.trackByAWB(awbOrOrderId);
    } else {
      const order = await Order.findOne({
        $or: [{ _id: awbOrOrderId.match(/^[0-9a-fA-F]{24}$/) ? awbOrOrderId : null }, { orderNumber: awbOrOrderId }],
      });

      if (order && order.shiprocket?.awbCode) {
        trackingData = await ShiprocketService.trackByAWB(order.shiprocket.awbCode);
      } else if (order) {
        trackingData = await ShiprocketService.trackByOrderId(order.orderNumber);
      } else {
        trackingData = await ShiprocketService.trackByAWB(awbOrOrderId);
      }
    }

    res.json({
      success: true,
      data: trackingData,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 5. Handle Shiprocket Webhook Updates
 */
export const handleShiprocketWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { awb, current_status, order_id } = req.body;

    const order = await Order.findOne({
      $or: [{ "shiprocket.awbCode": awb }, { orderNumber: order_id }],
    });

    if (order) {
      order.shiprocket.status = current_status;
      order.shiprocket.lastTrackedAt = new Date();

      if (current_status === "OUT FOR DELIVERY") {
        order.orderStatus = "Out for Delivery";
      } else if (current_status === "DELIVERED") {
        order.orderStatus = "Delivered";
        order.paymentStatus = "Paid";
      }

      await order.save();
    }

    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
};
