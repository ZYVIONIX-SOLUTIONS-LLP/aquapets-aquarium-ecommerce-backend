import axios, { AxiosInstance } from "axios";
import { config } from "../config/env.js";

interface ShiprocketAuthResponse {
  token: string;
  expires_in?: number;
}

export class ShiprocketService {
  private static client: AxiosInstance = axios.create({
    baseURL: "https://apiv2.shiprocket.in/v1/external",
    headers: {
      "Content-Type": "application/json",
    },
  });

  private static token: string | null = null;
  private static tokenExpiresAt: number = 0;

  /**
   * Authenticate and get cached JWT token for Shiprocket API
   */
  static async getToken(): Promise<string> {
    const now = Date.now();
    // Use cached token if valid for at least another 5 minutes
    if (this.token && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.token;
    }

    if (!config.shiprocket.email || !config.shiprocket.password) {
      throw new Error("Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) not configured.");
    }

    try {
      const response = await axios.post<ShiprocketAuthResponse>(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          email: config.shiprocket.email,
          password: config.shiprocket.password,
        }
      );

      this.token = response.data.token;
      // Default expiration 10 days if not returned
      const expiresInMs = (response.data.expires_in || 10 * 24 * 60 * 60) * 1000;
      this.tokenExpiresAt = now + expiresInMs;

      return this.token;
    } catch (error: any) {
      console.error("❌ Shiprocket Auth Failed:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to authenticate with Shiprocket");
    }
  }

  private static async getAuthHeaders() {
    const token = await this.getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Check courier serviceability for a delivery pincode
   */
  static async checkServiceability(pickupPincode: string, deliveryPincode: string, weightKg: number = 0.5, cod: boolean = false) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.get("/courier/serviceability", {
      headers,
      params: {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weightKg,
        cod: cod ? 1 : 0,
      },
    });
    return response.data;
  }

  /**
   * Create custom shipment order in Shiprocket
   */
  static async createOrder(orderPayload: {
    order_id: string;
    order_date: string;
    pickup_location?: string;
    billing_customer_name: string;
    billing_last_name?: string;
    billing_address: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country?: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    order_items: Array<{
      name: string;
      sku: string;
      units: number;
      selling_price: number;
      discount?: number;
    }>;
    payment_method: "Prepaid" | "COD";
    sub_total: number;
    length?: number;
    breadth?: number;
    height?: number;
    weight: number;
  }) {
    const headers = await this.getAuthHeaders();
    const payload = {
      ...orderPayload,
      pickup_location: orderPayload.pickup_location || config.shiprocket.pickupLocation,
      billing_country: orderPayload.billing_country || "India",
      shipping_is_billing: true,
      length: orderPayload.length || 10,
      breadth: orderPayload.breadth || 10,
      height: orderPayload.height || 10,
    };

    const response = await this.client.post("/orders/create/adhoc", payload, { headers });
    return response.data;
  }

  /**
   * Generate AWB (Airway Bill) code for shipment
   */
  static async generateAWB(shipmentId: number, courierId?: number) {
    const headers = await this.getAuthHeaders();
    const payload: any = { shipment_id: shipmentId };
    if (courierId) payload.courier_id = courierId;

    const response = await this.client.post("/courier/assign/awb", payload, { headers });
    return response.data;
  }

  /**
   * Request pickup for shipment
   */
  static async requestPickup(shipmentId: number, pickupDate?: string[]) {
    const headers = await this.getAuthHeaders();
    const payload: any = { shipment_id: [shipmentId] };
    if (pickupDate) payload.pickup_date = pickupDate;

    const response = await this.client.post("/courier/generate/pickup", payload, { headers });
    return response.data;
  }

  /**
   * Generate shipping label
   */
  static async generateLabel(shipmentId: number) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.post("/courier/generate/label", { shipment_id: [shipmentId] }, { headers });
    return response.data;
  }

  /**
   * Generate manifest
   */
  static async generateManifest(shipmentId: number) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.post("/manifests/generate", { shipment_id: [shipmentId] }, { headers });
    return response.data;
  }

  /**
   * Track shipment via AWB code
   */
  static async trackByAWB(awbCode: string) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.get(`/courier/track/awb/${awbCode}`, { headers });
    return response.data;
  }

  /**
   * Track shipment via Order ID
   */
  static async trackByOrderId(orderId: string) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.get(`/courier/track`, {
      headers,
      params: { order_id: orderId },
    });
    return response.data;
  }
}
