import crypto from "crypto";
import { razorpayInstance } from "../config/razorpay.js";
import { config } from "../config/env.js";

export class RazorpayService {
  /**
   * Create an order in Razorpay (amount in paise, e.g. 500 INR = 50000 paise)
   */
  static async createOrder(amountInRupees: number, receipt: string, notes: Record<string, string> = {}) {
    const amountInPaise = Math.round(amountInRupees * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    };

    try {
      if (config.razorpay.keySecret && config.razorpay.keySecret !== "YOUR_RAZORPAY_TEST_SECRET") {
        const liveOrder = await razorpayInstance.orders.create(options);
        return { ...liveOrder, isLive: true };
      }
    } catch (apiErr: any) {
      console.warn("⚠️ Razorpay API returned error:", apiErr.error?.description || apiErr.message);
    }

    // In local sandbox / testing without live secret key, generate valid simulated Razorpay order structure
    return {
      id: `order_${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`,
      entity: "order",
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: "INR",
      receipt,
      status: "created",
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
      isLive: false,
    };
  }

  /**
   * Verify Razorpay payment signature
   * signature = HMAC_SHA256(orderId + "|" + paymentId, secret)
   */
  static verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    if (!config.razorpay.keySecret || config.razorpay.keySecret === "YOUR_RAZORPAY_TEST_SECRET") {
      // Allow only in explicit non-production development
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      console.error("❌ RAZORPAY_KEY_SECRET is not configured in production");
      return false;
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    try {
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      const sigBuf = Buffer.from(razorpaySignature, "hex");
      if (expectedBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return expectedSignature === razorpaySignature;
    }
  }

  /**
   * Verify Razorpay Webhook signature
   */
  static verifyWebhookSignature(rawBody: string, webhookSignature: string): boolean {
    if (!webhookSignature) return false;

    if (!config.razorpay.webhookSecret || config.razorpay.webhookSecret === "YOUR_RAZORPAY_WEBHOOK_SECRET") {
      if (process.env.NODE_ENV !== "production") {
        return true;
      }
      console.error("❌ RAZORPAY_WEBHOOK_SECRET is not configured in production");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.webhookSecret)
      .update(rawBody)
      .digest("hex");

    try {
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      const sigBuf = Buffer.from(webhookSignature, "hex");
      if (expectedBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return expectedSignature === webhookSignature;
    }
  }

  /**
   * Fetch payment details by paymentId
   */
  static async fetchPayment(paymentId: string) {
    return await razorpayInstance.payments.fetch(paymentId);
  }

  /**
   * Fetch order details by orderId from Razorpay
   */
  static async fetchOrder(orderId: string) {
    if (!orderId) return null;
    try {
      if (config.razorpay.keySecret && config.razorpay.keySecret !== "YOUR_RAZORPAY_TEST_SECRET") {
        return await razorpayInstance.orders.fetch(orderId);
      }
    } catch (apiErr: any) {
      console.warn(`⚠️ Razorpay fetchOrder error for ${orderId}:`, apiErr?.error?.description || apiErr?.message);
    }
    return null;
  }

  /**
   * Fetch all payments associated with a Razorpay orderId
   */
  static async fetchOrderPayments(orderId: string): Promise<any[]> {
    if (!orderId) return [];
    try {
      if (config.razorpay.keySecret && config.razorpay.keySecret !== "YOUR_RAZORPAY_TEST_SECRET") {
        const res: any = await razorpayInstance.orders.fetchPayments(orderId);
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.items)) return res.items;
      }
    } catch (apiErr: any) {
      console.warn(`⚠️ Razorpay fetchOrderPayments error for ${orderId}:`, apiErr?.error?.description || apiErr?.message);
    }
    return [];
  }

  /**
   * Independently verify payment status directly with Razorpay
   * Checks both order entity status and payment items.
   */
  static async checkOrderPaidStatus(razorpayOrderId: string): Promise<{
    isPaid: boolean;
    paymentId?: string;
    amount?: number;
    status?: string;
    rawPayment?: any;
    error?: string;
  }> {
    if (!razorpayOrderId) {
      return { isPaid: false, error: "Missing razorpayOrderId" };
    }

    try {
      // 1. Fetch payments associated with this Razorpay order
      const payments = await this.fetchOrderPayments(razorpayOrderId);
      if (payments && payments.length > 0) {
        // Find any successfully captured payment
        const capturedPayment = payments.find((p: any) => p && p.status === "captured");
        if (capturedPayment) {
          return {
            isPaid: true,
            paymentId: capturedPayment.id,
            amount: capturedPayment.amount ? capturedPayment.amount / 100 : undefined,
            status: "captured",
            rawPayment: capturedPayment,
          };
        }

        // Find any authorized payment (can be auto-captured)
        const authorizedPayment = payments.find((p: any) => p && p.status === "authorized");
        if (authorizedPayment) {
          return {
            isPaid: true,
            paymentId: authorizedPayment.id,
            amount: authorizedPayment.amount ? authorizedPayment.amount / 100 : undefined,
            status: "authorized",
            rawPayment: authorizedPayment,
          };
        }
      }

      // 2. Fallback to order status check on Razorpay
      const rzpOrder: any = await this.fetchOrder(razorpayOrderId);
      if (rzpOrder) {
        const isPaid =
          rzpOrder.status === "paid" ||
          (typeof rzpOrder.amount_paid === "number" && rzpOrder.amount_paid > 0 && rzpOrder.amount_paid >= rzpOrder.amount);

        if (isPaid) {
          const fallbackPaymentId = payments?.[0]?.id || `pay_verified_${rzpOrder.id}`;
          return {
            isPaid: true,
            paymentId: fallbackPaymentId,
            amount: rzpOrder.amount_paid ? rzpOrder.amount_paid / 100 : undefined,
            status: rzpOrder.status,
            rawPayment: rzpOrder,
          };
        }

        return {
          isPaid: false,
          status: rzpOrder.status,
        };
      }
    } catch (err: any) {
      console.warn(`⚠️ Error checking Razorpay status for ${razorpayOrderId}:`, err?.message);
      return { isPaid: false, error: err?.message };
    }

    return { isPaid: false };
  }
}
