import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Order, IShiprocketActivity } from "../models/Order.js";
import { ShiprocketService } from "../services/shiprocketService.js";
import { config } from "../config/env.js";

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

    const safeWeight = Math.max(0.1, Number(weightKg) || 0.5);

    // Fallback weight-tiered charges:
    let standardCourierRate = 60;
    if (safeWeight > 0.5 && safeWeight <= 1.0) {
      standardCourierRate = 90;
    } else if (safeWeight > 1.0) {
      standardCourierRate = Math.round(90 + Math.ceil(safeWeight - 1.0) * 45);
    }

    // Porter Local Express (2-Wheeler / 3-Wheeler)
    let porterFare = 120;
    let porterVehicle = "Porter 2-Wheeler (Express)";
    if (safeWeight > 15) {
      porterFare = 380;
      porterVehicle = "Porter 3-Wheeler / 4-Wheeler (Heavy Parcel)";
    } else if (safeWeight > 5) {
      porterFare = 260;
      porterVehicle = "Porter 3-Wheeler (Standard)";
    } else if (safeWeight > 2) {
      porterFare = 180;
      porterVehicle = "Porter 2-Wheeler / 3-Wheeler";
    }

    let liveCourierData = {
      available: true,
      courier: "Standard Courier (DTDC / Blue Dart)",
      rate: standardCourierRate,
      estimatedDays: "2-4 Days",
      etd: "",
      isLiveRate: false,
    };

    let rawShiprocketData = null;

    try {
      const data = await ShiprocketService.checkServiceability(pickupPincode, String(deliveryPincode).trim(), safeWeight, Boolean(cod));
      rawShiprocketData = data;

      const availableCouriers: any[] = data.data?.available_courier_companies || [];
      if (availableCouriers.length > 0) {
        // Priority 1: DTDC Courier (Store Priority)
        const dtdcCouriers = availableCouriers.filter((c) =>
          (c.courier_name || "").toUpperCase().includes("DTDC")
        );

        let chosen = null;
        if (dtdcCouriers.length > 0) {
          // Sort DTDC couriers by rate ascending to choose the most cost-effective DTDC service
          chosen = [...dtdcCouriers].sort(
            (a, b) => Number(a.rate || a.freight_charge) - Number(b.rate || b.freight_charge)
          )[0];
        }

        // Priority 2: Fallback to best rate available courier if DTDC is not serviceable to this pincode
        if (!chosen) {
          chosen = [...availableCouriers].sort(
            (a, b) => Number(a.rate || a.freight_charge) - Number(b.rate || b.freight_charge)
          )[0];
        }
        if (!chosen) {
          const recommendedId = data.data?.recommended_courier_company_id;
          chosen = availableCouriers.find((c) => c.courier_company_id === recommendedId);
        }

        if (chosen) {
          const parsedRate = Math.round(Number(chosen.rate || chosen.freight_charge));
          const estDays = chosen.estimated_delivery_days ? `${chosen.estimated_delivery_days} Days` : "2-3 Days";
          liveCourierData = {
            available: true,
            courier: chosen.courier_name || "Express Courier",
            rate: parsedRate > 0 ? parsedRate : standardCourierRate,
            estimatedDays: estDays,
            etd: chosen.etd || "",
            isLiveRate: true,
          };
        }
      }
    } catch (shiprocketErr: any) {
      // Gracefully fall back to standard tiered rates
      console.warn("Shiprocket live rate check fallback:", shiprocketErr.response?.data?.message || shiprocketErr.message);
    }

    res.json({
      success: true,
      serviceability: true,
      weightKg: safeWeight,
      courier: liveCourierData,
      porter: {
        available: true,
        estimatedTime: "45 mins",
        fare: porterFare,
        vehicle: porterVehicle,
        weightKg: safeWeight,
      },
      data: rawShiprocketData || {
        porter: {
          available: true,
          estimatedTime: "45 mins",
          fare: porterFare,
          vehicle: porterVehicle,
          weightKg: safeWeight,
        },
        shiprocket: {
          available: true,
          estimatedDays: liveCourierData.estimatedDays,
          rate: liveCourierData.rate,
          courier: liveCourierData.courier,
          weightKg: safeWeight,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Helper to find order by Mongo ID or orderNumber
 */
const findOrderByIdOrNumber = async (identifier: string) => {
  if (!identifier) return null;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(identifier);
  return Order.findOne({
    $or: [
      ...(isMongoId ? [{ _id: identifier }] : []),
      { orderNumber: identifier },
      { "shiprocket.awbCode": identifier },
    ],
  });
};

/**
 * 1. Create Shiprocket Shipment Order
 */
export const createShipmentOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = String(req.params.orderId);

    const order = await findOrderByIdOrNumber(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "Paid";
    if (!isPaid) {
      res.status(400).json({
        success: false,
        message: "Cannot create shipment: Order payment is PENDING or UNPAID. Only verified paid orders can be fulfilled.",
      });
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
      billing_email: order.shippingAddress.email || "customer@aquapets.in",
      billing_phone: order.shippingAddress.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: "Prepaid",
      sub_total: order.total,
      weight: totalWeight || 0.5,
    });

    const shipmentId = shiprocketResponse.shipment_id || shiprocketResponse.response?.data?.shipment_id;
    const srOrderId = shiprocketResponse.order_id || shiprocketResponse.response?.data?.order_id;

    if (!shipmentId && !srOrderId) {
      const errMsg = shiprocketResponse.message || shiprocketResponse.response?.data?.message || "Failed to create shipment in Shiprocket";
      res.status(400).json({ success: false, message: errMsg, raw: shiprocketResponse });
      return;
    }

    // Update order with Shiprocket shipment data
    order.shiprocket.orderId = srOrderId;
    order.shiprocket.shipmentId = shipmentId;
    order.shiprocket.status = shiprocketResponse.status || "PROCESSING";
    order.orderStatus = "Processing";
    await order.save();

    res.json({
      success: true,
      message: "Shiprocket shipment created successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
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
    const orderId = String(req.params.orderId);
    const { courierId } = req.body;

    const order = await findOrderByIdOrNumber(orderId);
    if (!order || !order.shiprocket?.shipmentId) {
      res.status(400).json({ success: false, message: "Order does not have an active Shiprocket shipment ID" });
      return;
    }

    const awbResponse = await ShiprocketService.generateAWB(order.shiprocket.shipmentId, courierId);

    const awbCode =
      awbResponse.response?.data?.awb_code ||
      awbResponse.awb_code ||
      awbResponse.data?.awb_code;

    const courierName =
      awbResponse.response?.data?.courier_name ||
      awbResponse.courier_name ||
      awbResponse.data?.courier_name ||
      "DTDC Express";

    if (!awbCode) {
      const errMsg =
        awbResponse.message ||
        awbResponse.response?.data?.message ||
        "Could not generate AWB. Please check courier balance or serviceability in Shiprocket.";
      res.status(400).json({ success: false, message: errMsg, raw: awbResponse });
      return;
    }

    order.shiprocket.awbCode = awbCode;
    order.shiprocket.courierName = courierName;
    order.shiprocket.trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
    order.shiprocket.status = "AWB_ASSIGNED";
    order.orderStatus = "Packed";
    await order.save();

    res.json({
      success: true,
      message: "AWB Generated Successfully",
      data: {
        awbCode,
        courierName,
        trackingUrl: order.shiprocket.trackingUrl,
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
    const orderId = String(req.params.orderId);
    const { pickupDate } = req.body;

    const order = await findOrderByIdOrNumber(orderId);
    if (!order || !order.shiprocket?.shipmentId) {
      res.status(400).json({ success: false, message: "Shipment ID not found on this order" });
      return;
    }

    const pickupResponse = await ShiprocketService.requestPickup(
      order.shiprocket.shipmentId,
      pickupDate ? [pickupDate] : undefined
    );

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
 * 4. Generate Shipping Label
 */
export const generateLabel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = String(req.params.orderId);

    const order = await findOrderByIdOrNumber(orderId);
    if (!order || !order.shiprocket?.shipmentId) {
      res.status(400).json({ success: false, message: "Shipment ID not found on this order" });
      return;
    }

    const labelResponse = await ShiprocketService.generateLabel(order.shiprocket.shipmentId);
    const labelUrl =
      labelResponse.label_url ||
      labelResponse.response?.label_url ||
      labelResponse.response?.data?.label_url;

    if (labelUrl) {
      order.shiprocket.labelUrl = labelUrl;
      await order.save();
    }

    res.json({
      success: true,
      message: "Shipping label generated",
      data: {
        labelUrl,
        raw: labelResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 5. Track Shipment Status in Real-time (AWB or Order ID)
 * Supports both live Shiprocket query and database fallback with webhook timeline
 */
export const trackShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const awbOrOrderId = String(req.params.awbOrOrderId || "").trim();

    if (!awbOrOrderId) {
      res.status(400).json({ success: false, message: "Order ID or AWB code is required" });
      return;
    }

    // 1. Search in local database
    const orderMatch = await findOrderByIdOrNumber(awbOrOrderId);

    let trackingData: any = null;
    let awbCodeToUse = orderMatch?.shiprocket?.awbCode || (/^\d{8,}$/.test(awbOrOrderId) ? awbOrOrderId : "");

    // 2. If AWB or Order Number is present, attempt live Shiprocket tracking
    if (awbCodeToUse || orderMatch?.orderNumber) {
      try {
        if (awbCodeToUse) {
          trackingData = await ShiprocketService.trackByAWB(awbCodeToUse);
        } else if (orderMatch?.orderNumber) {
          trackingData = await ShiprocketService.trackByOrderId(orderMatch.orderNumber);
        }
      } catch (liveErr: any) {
        // Shiprocket live tracking failed (offline, unauthorized or un-manifested)
        console.warn("Live Shiprocket tracking query fallback:", liveErr.response?.data?.message || liveErr.message);
      }
    }

    // 3. Extract info from live tracking response if available
    const trackInfo = trackingData?.tracking_data || trackingData;
    const shipmentTrack = Array.isArray(trackInfo?.shipment_track) ? trackInfo.shipment_track[0] : null;
    const liveActivities: any[] = trackInfo?.shipment_track_activities || shipmentTrack?.scans || [];

    // If live tracking data returned new updates, synchronize them to the order in MongoDB
    if (orderMatch && shipmentTrack) {
      const liveStatus = shipmentTrack.current_status || shipmentTrack.shipment_status;
      if (liveStatus) {
        orderMatch.shiprocket.status = liveStatus;
        if (shipmentTrack.courier_name) orderMatch.shiprocket.courierName = shipmentTrack.courier_name;
        if (shipmentTrack.etd) orderMatch.shiprocket.etd = shipmentTrack.etd;
        if (shipmentTrack.awb_code) orderMatch.shiprocket.awbCode = shipmentTrack.awb_code;
        orderMatch.shiprocket.lastTrackedAt = new Date();

        const upper = String(liveStatus).toUpperCase();
        if (upper.includes("DELIVERED")) {
          orderMatch.orderStatus = "Delivered";
          orderMatch.paymentStatus = "Paid";
        } else if (upper.includes("OUT FOR DELIVERY")) {
          orderMatch.orderStatus = "Out for Delivery";
        }

        if (Array.isArray(liveActivities) && liveActivities.length > 0) {
          orderMatch.shiprocket.activities = liveActivities.map((act) => ({
            date: act.date || act.activity_date || new Date().toISOString(),
            status: act.status || act.sr_status || liveStatus,
            activity: act.activity || act.location || "Transit scan",
            location: act.location || "",
            srStatus: act.sr_status || "",
          }));
        }

        await orderMatch.save();
      }
    }

    // 4. If we have neither an order match nor valid live tracking data
    if (!orderMatch && !shipmentTrack && !trackingData) {
      res.status(404).json({
        success: false,
        message: `No tracking information found for '${awbOrOrderId}'. Please check your Order ID or AWB tracking code.`,
      });
      return;
    }

    // 5. Build consolidated tracking response (from Webhook updates + database + live data)
    const currentStatus =
      shipmentTrack?.current_status ||
      orderMatch?.shiprocket?.status ||
      orderMatch?.orderStatus ||
      "IN TRANSIT";

    const courier =
      shipmentTrack?.courier_name ||
      orderMatch?.shiprocket?.courierName ||
      (orderMatch?.deliveryMethod === "porter" ? "Porter Hyperlocal Express" : "AquaPets Standard Logistics");

    const finalAwb = shipmentTrack?.awb_code || awbCodeToUse || orderMatch?.shiprocket?.awbCode || "";

    // Build timeline activities (prefer order's webhook activities or live activities; synthesize if empty)
    let activities: any[] = [];
    if (Array.isArray(liveActivities) && liveActivities.length > 0) {
      activities = liveActivities.map((act) => ({
        date: act.date || act.activity_date || "",
        status: act.status || act.sr_status || currentStatus,
        activity: act.activity || act.location || "Logistics Scan",
        location: act.location || "",
      }));
    } else if (orderMatch?.shiprocket?.activities && orderMatch.shiprocket.activities.length > 0) {
      activities = orderMatch.shiprocket.activities;
    } else if (orderMatch) {
      // Synthesize timeline from order status
      const createdStr = new Date(orderMatch.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      activities.push({
        date: createdStr,
        status: "ORDER_PLACED",
        activity: "Order placed successfully by customer",
        location: "AquaPets Online Store",
      });

      if (orderMatch.paymentStatus === "Paid" || orderMatch.paymentStatus === "PAID") {
        activities.push({
          date: createdStr,
          status: "PAYMENT_CONFIRMED",
          activity: `Payment confirmed via ${orderMatch.paymentMethod}`,
          location: "Payment Gateway",
        });
      }

      if (["Packed", "Processing", "Out for Delivery", "Delivered"].includes(orderMatch.orderStatus)) {
        activities.push({
          date: new Date(orderMatch.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          status: "PACKED",
          activity: "Parcel verified, quality-checked and packaged",
          location: "Kochi Fulfilment Center",
        });
      }

      if (finalAwb) {
        activities.push({
          date: orderMatch.shiprocket?.pickupScheduledDate || new Date(orderMatch.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          status: "AWB_ASSIGNED",
          activity: `Airway Bill generated (${finalAwb}) with ${courier}`,
          location: "Kochi Logistics Hub",
        });
      }

      if (["Out for Delivery", "Delivered"].includes(orderMatch.orderStatus)) {
        activities.push({
          date: new Date(orderMatch.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          status: "OUT_FOR_DELIVERY",
          activity: "Package is out with courier rider for final delivery",
          location: orderMatch.shippingAddress?.city || "Destination City",
        });
      }

      if (orderMatch.orderStatus === "Delivered") {
        activities.push({
          date: new Date(orderMatch.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          status: "DELIVERED",
          activity: "Shipment successfully delivered to recipient",
          location: `${orderMatch.shippingAddress?.city}, ${orderMatch.shippingAddress?.pincode}`,
        });
      }
    }

    res.json({
      success: true,
      data: {
        orderId: orderMatch?._id,
        orderNumber: orderMatch?.orderNumber || awbOrOrderId,
        awbCode: finalAwb,
        courier,
        currentStatus,
        orderStatus: orderMatch?.orderStatus || "Processing",
        paymentStatus: orderMatch?.paymentStatus || "Paid",
        deliveryMethod: orderMatch?.deliveryMethod || "courier",
        etd: shipmentTrack?.etd || orderMatch?.shiprocket?.etd || "2-3 Business Days",
        origin: shipmentTrack?.origin || "Kochi, Kerala",
        destination: shipmentTrack?.destination || (orderMatch ? `${orderMatch.shippingAddress?.city}, ${orderMatch.shippingAddress?.state} (${orderMatch.shippingAddress?.pincode})` : ""),
        currentLocation: orderMatch?.shiprocket?.currentLocation || shipmentTrack?.current_location || (orderMatch?.orderStatus === "Delivered" ? orderMatch.shippingAddress?.city : "Kochi Logistics Hub"),
        trackingUrl: orderMatch?.shiprocket?.trackingUrl || (finalAwb ? `https://shiprocket.co/tracking/${finalAwb}` : ""),
        lastTrackedAt: orderMatch?.shiprocket?.lastTrackedAt || new Date(),
        activities,
        shippingAddress: orderMatch ? {
          fullName: orderMatch.shippingAddress?.fullName,
          city: orderMatch.shippingAddress?.city,
          state: orderMatch.shippingAddress?.state,
          pincode: orderMatch.shippingAddress?.pincode,
        } : null,
        items: orderMatch ? orderMatch.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
          selectedVariant: i.selectedVariant,
        })) : [],
        total: orderMatch?.total,
        dataSource: shipmentTrack ? "shiprocket_live" : "webhook_and_db",
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * 6. Handle Shiprocket Webhook Updates
 */
export const handleShiprocketWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Optional webhook token/secret verification
    const expectedSecret = (config.shiprocket.webhookSecret || "").trim();
    if (expectedSecret) {
      const incomingSecret = String(
        req.headers["x-api-key"] ||
        req.headers["x-shiprocket-secret"] ||
        req.headers["x-webhook-token"] ||
        ""
      ).trim();

      const bearerToken = String(
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, "")) || ""
      ).trim();

      let isAuthorized =
        (incomingSecret && incomingSecret === expectedSecret) ||
        (bearerToken && bearerToken === expectedSecret);

      // Allow verified Admin Panel users (JWT token) to trigger webhook simulations
      if (!isAuthorized && bearerToken) {
        try {
          const decoded = jwt.verify(bearerToken, config.jwtSecret) as any;
          if (decoded && decoded.id) {
            isAuthorized = true;
          }
        } catch {
          // not a valid JWT
        }
      }

      // If token was provided but did not match, reject
      if (!isAuthorized && (incomingSecret || bearerToken)) {
        console.warn("⚠️ Shiprocket webhook unauthorized token attempt:", incomingSecret || bearerToken);
        res.status(401).json({ success: false, message: "Unauthorized webhook token" });
        return;
      }
    }

    const payload = Array.isArray(req.body) ? req.body[0] : (req.body || {});

    // Flexible field extraction for various Shiprocket webhook schemas
    const awb = String(payload?.awb || payload?.awb_code || payload?.awbCode || payload?.tracking_number || "").trim();
    const orderId = String(payload?.order_id || payload?.orderNumber || payload?.channel_order_id || payload?.sr_order_id || "").trim();
    const shipmentId = payload?.shipment_id || payload?.shipmentId;
    const currentStatus = String(payload?.current_status || payload?.shipment_status || payload?.status || payload?.order_status || "").trim();
    const currentStatusId = Number(payload?.current_status_id || payload?.status_id) || undefined;
    const courierName = payload?.courier_name || payload?.courier || payload?.courier_company || "";
    const location = payload?.location || payload?.current_location || payload?.city || payload?.hub || "";
    const etd = payload?.etd || payload?.estimated_delivery_date || "";
    const scans: any[] = payload?.scans || payload?.activities || payload?.shipment_track_activities || [];

    // Handle test ping / empty ping from Shiprocket dashboard verification
    if (!payload || typeof payload !== "object" || (!awb && !orderId && !shipmentId)) {
      console.log("📡 Shiprocket Webhook test ping or health check acknowledged successfully");
      res.status(200).json({
        success: true,
        message: "AquaPets Shiprocket Webhook endpoint is active and verified",
        status: "connected",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log(`📡 Shiprocket Webhook received: AWB='${awb}', OrderID='${orderId}', Status='${currentStatus}', Location='${location}'`);

    const queryConditions: any[] = [];
    if (awb) queryConditions.push({ "shiprocket.awbCode": awb });
    if (orderId) queryConditions.push({ orderNumber: orderId });
    if (shipmentId) queryConditions.push({ "shiprocket.shipmentId": Number(shipmentId) });
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) queryConditions.push({ _id: orderId });

    if (queryConditions.length === 0) {
      res.status(200).json({
        success: true,
        message: "Webhook ping received with no active order criteria",
      });
      return;
    }

    const order = await Order.findOne({ $or: queryConditions });

    if (!order) {
      console.warn(`⚠️ Order not found in database for Webhook AWB: ${awb}, OrderID: ${orderId}`);
      // Return 200 so Shiprocket does not keep retrying unnecessarily
      res.json({
        success: true,
        message: "Webhook received but order was not found in system",
        awb,
        orderId,
      });
      return;
    }

    // Update order shiprocket details
    if (currentStatus) {
      order.shiprocket.status = currentStatus;
    }
    if (currentStatusId) {
      order.shiprocket.statusCode = currentStatusId;
    }
    if (courierName) {
      order.shiprocket.courierName = courierName;
    }
    if (location) {
      order.shiprocket.currentLocation = location;
    }
    if (etd) {
      order.shiprocket.etd = etd;
    }
    if (awb && !order.shiprocket.awbCode) {
      order.shiprocket.awbCode = awb;
    }
    if (awb || order.shiprocket.awbCode) {
      order.shiprocket.trackingUrl = `https://shiprocket.co/tracking/${awb || order.shiprocket.awbCode}`;
    }
    order.shiprocket.lastTrackedAt = new Date();

    // Map Shiprocket courier statuses to Order status
    const normalizedStatus = currentStatus.toUpperCase();
    if (normalizedStatus.includes("DELIVERED")) {
      order.orderStatus = "Delivered";
      order.paymentStatus = "Paid";
    } else if (normalizedStatus.includes("OUT FOR DELIVERY") || normalizedStatus.includes("OUT_FOR_DELIVERY")) {
      order.orderStatus = "Out for Delivery";
    } else if (
      normalizedStatus.includes("PICKED UP") ||
      normalizedStatus.includes("IN TRANSIT") ||
      normalizedStatus.includes("SHIPPED") ||
      normalizedStatus.includes("REACHED")
    ) {
      if (order.orderStatus !== "Out for Delivery" && order.orderStatus !== "Delivered") {
        order.orderStatus = "Processing";
      }
    } else if (normalizedStatus.includes("CANCEL") || normalizedStatus.includes("RTO")) {
      order.orderStatus = "Cancelled";
    }

    // Append scan activities
    if (Array.isArray(scans) && scans.length > 0) {
      const existing = order.shiprocket.activities || [];
      const newActivities: IShiprocketActivity[] = scans.map((s: any) => ({
        date: s.date || s.activity_date || new Date().toISOString(),
        status: s.status || s.sr_status || currentStatus,
        activity: s.activity || s.location || "Transit scan",
        location: s.location || location,
        srStatus: s.sr_status || "",
      }));

      // Combine and deduplicate by date + status
      const existingKeys = new Set(existing.map((e) => `${e.date}_${e.status}`));
      for (const act of newActivities) {
        if (!existingKeys.has(`${act.date}_${act.status}`)) {
          existing.push(act);
        }
      }
      order.shiprocket.activities = existing;
    } else if (currentStatus) {
      // Push single event if not already recorded
      if (!order.shiprocket.activities) order.shiprocket.activities = [];
      const nowStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      order.shiprocket.activities.push({
        date: nowStr,
        status: currentStatus,
        activity: `Shipment updated: ${currentStatus}${location ? ` at ${location}` : ""}`,
        location: location || "",
        srStatus: currentStatus,
      });
    }

    await order.save();

    res.json({
      success: true,
      message: "Order tracking status updated successfully from webhook",
      data: {
        orderNumber: order.orderNumber,
        awbCode: order.shiprocket.awbCode,
        orderStatus: order.orderStatus,
        shippingStatus: order.shiprocket.status,
        courier: order.shiprocket.courierName,
        currentLocation: order.shiprocket.currentLocation,
        lastTrackedAt: order.shiprocket.lastTrackedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Verification Endpoint for Shiprocket Webhook (GET /api/shipping/webhook)
 */
export const verifyWebhookEndpoint = async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    status: "active",
    message: "AquaPets Shiprocket Webhook endpoint is online and listening for tracking events.",
    endpoint: "/api/shipping/webhook",
    eventsSupported: [
      "AWB_ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "RTO_INITIATED",
      "CANCELLED",
    ],
    timestamp: new Date().toISOString(),
  });
};
