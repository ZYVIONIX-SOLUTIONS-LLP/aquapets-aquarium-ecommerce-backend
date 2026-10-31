/**
 * WhatsApp Notification Service for Aqua Pets Backend, Shop Owner & Customer
 */

export interface WhatsAppOrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    houseBuilding: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  paymentMethod: string;
  deliveryMethod?: "porter" | "courier" | string;
  notes?: string;
}

export const SHOP_OWNER_WHATSAPP_NUMBER = process.env.SHOP_OWNER_WHATSAPP || "916238392582";

/**
 * Clean & normalize phone number into E.164 without '+' or spaces (e.g. 919876543210)
 */
export function normalizePhoneNumber(phone: string): string {
  let clean = (phone || "").replace(/[^0-9]/g, "");
  // If 10-digit Indian number, prepend country code 91
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return clean;
}

/**
 * Message template formatted for the Store Owner with explicit Porter vs Courier identification and Courier charge
 */
export function formatShopOwnerOrderMessage(data: WhatsAppOrderData): string {
  const isPorter =
    data.deliveryMethod === "porter" ||
    (data.notes && data.notes.toLowerCase().includes("porter"));

  const itemsText = data.items
    .map(
      (item, i) =>
        `   ${i + 1}. *${item.name}* (Qty: ${item.quantity}) - ₹${(
          item.price * item.quantity
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  const header = isPorter
    ? `🚨 *URGENT: NEW PORTER ORDER RECEIVED* 🚨`
    : `🔔 *NEW ORDER RECEIVED - COURIER ALERT* 🔔`;

  const dispatchInstruction = isPorter
    ? `🛵 *DISPATCH MODE:* ⚡ *PORTER (Local Ernakulam)*\n` +
      `⚠️ *ACTION REQUIRED:* Please arrange Porter pickup immediately! Customer pays Porter delivery charges directly on arrival.\n`
    : `🚚 *DISPATCH MODE:* 📦 *COURIER / SHIPROCKET*\n` +
      `ℹ️ *ACTION REQUIRED:* Pack items safely and generate courier shipping label via Shiprocket.\n`;

  const courierChargeLine = isPorter
    ? `🛵 *Porter Delivery Fee:* Extra (Payable directly by customer to rider on arrival)\n`
    : `🚚 *Courier Shipping Charge:* ₹${(data.deliveryFee ?? 0).toLocaleString("en-IN")}\n`;

  const subtotalLine =
    typeof data.subtotal === "number" && data.subtotal > 0
      ? `📦 *Items Subtotal:* ₹${data.subtotal.toLocaleString("en-IN")}\n`
      : "";

  return (
    `${header}\n\n` +
    dispatchInstruction + `\n` +
    `📌 *Order Number:* #${data.orderNumber}\n` +
    `👤 *Customer Name:* ${data.customerName}\n` +
    `📞 *Customer Contact:* ${data.customerPhone}\n` +
    `📍 *Delivery Address:* ${data.shippingAddress.houseBuilding ? data.shippingAddress.houseBuilding + ", " : ""}${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}\n\n` +
    `🛒 *Items to Pack:*\n${itemsText}\n\n` +
    subtotalLine +
    courierChargeLine +
    `💳 *Order Total:* ₹${data.total.toLocaleString("en-IN")}\n` +
    `💰 *Payment Status:* ${data.paymentMethod}\n` +
    `📝 *Customer Notes:* ${data.notes || "None"}\n\n` +
    `⏰ *Order Time:* ${new Date().toLocaleString("en-IN")}\n\n` +
    `Aqua Pets Storefront Automated System 🐠`
  );
}

/**
 * Message template formatted for the Customer
 */
export function formatCustomerOrderMessage(data: WhatsAppOrderData): string {
  const isPorter =
    data.deliveryMethod === "porter" ||
    (data.notes && data.notes.toLowerCase().includes("porter"));

  const itemsText = data.items
    .map(
      (item, i) =>
        `  ${i + 1}. *${item.name}* (Qty: ${item.quantity}) - ₹${(
          item.price * item.quantity
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  const clientDomain = process.env.CLIENT_URL || "https://aquapets.in";
  const trackUrl = `${clientDomain}/track-order?id=${data.orderNumber}`;

  const courierChargeLine = isPorter
    ? `🛵 *Delivery Charges:* Extra (To be paid directly to Porter rider upon delivery)\n`
    : `🚚 *Courier Shipping Charge:* ₹${(data.deliveryFee ?? 0).toLocaleString("en-IN")}\n`;

  const subtotalLine =
    typeof data.subtotal === "number" && data.subtotal > 0
      ? `📦 *Items Subtotal:* ₹${data.subtotal.toLocaleString("en-IN")}\n`
      : "";

  return (
    `🐠 *AQUA PETS AQUARIUM — ORDER CONFIRMED!* 🐠\n\n` +
    `Dear *${data.customerName}*,\n` +
    `Thank you for shopping with Aqua Pets Aquarium! Your payment was successful and your order has been confirmed.\n\n` +
    `📦 *Order ID:* #${data.orderNumber}\n` +
    subtotalLine +
    courierChargeLine +
    `💳 *Total Amount Paid:* ₹${data.total.toLocaleString("en-IN")}\n` +
    `🚚 *Delivery Mode:* ${data.notes || (isPorter ? "Porter Express (Same-Day)" : "Standard Courier")}\n` +
    `📍 *Deliver to:* ${data.shippingAddress.houseBuilding ? data.shippingAddress.houseBuilding + ", " : ""}${data.shippingAddress.street}, ${data.shippingAddress.city} - ${data.shippingAddress.pincode}\n\n` +
    `🛒 *Items:*\n${itemsText}\n\n` +
    `🔍 *Track Live Shipment:*\n${trackUrl}\n\n` +
    `For queries, care advice, or Porter dispatch updates, chat with us on WhatsApp or call +91 98476 21685.\n\n` +
    `Happy Aquascaping! 🌿🐟`
  );
}

export function generateShopOwnerWhatsAppUrl(data: WhatsAppOrderData): string {
  const rawText = formatShopOwnerOrderMessage(data);
  const targetNumber = normalizePhoneNumber(SHOP_OWNER_WHATSAPP_NUMBER);
  return `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(rawText)}`;
}

export function generateCustomerWhatsAppUrl(data: WhatsAppOrderData): string {
  const rawText = formatCustomerOrderMessage(data);
  const targetNumber = normalizePhoneNumber(data.customerPhone);
  return `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(rawText)}`;
}

/**
 * Dispatches an automated message to any WhatsApp destination phone via configured Gateway:
 * Supports:
 *  1. Meta WhatsApp Cloud API (Official)
 *  2. Custom Webhook / UltraMsg / GreenAPI / Wati
 *  3. CallMeBot API (Test & Alert)
 */
export async function sendWhatsAppMessage(recipientPhone: string, messageText: string): Promise<boolean> {
  const cleanPhone = normalizePhoneNumber(recipientPhone);
  if (!cleanPhone || cleanPhone.length < 10) {
    console.warn("⚠️ Invalid WhatsApp recipient phone number:", recipientPhone);
    return false;
  }

  // Gateway 1: Meta WhatsApp Business Cloud API (Official)
  const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: true, body: messageText },
        }),
      });
      if (res.ok) {
        console.log(`✅ Meta Cloud API: WhatsApp sent to ${cleanPhone}`);
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      console.warn("⚠️ Meta Cloud API error:", errData);
    } catch (metaErr: any) {
      console.warn("⚠️ Meta Cloud API dispatch failed:", metaErr.message);
    }
  }

  // Gateway 2: UltraMsg / Webhook Gateway (Wati, AiSensy, GreenAPI, UltraMsg)
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanPhone,
          phone: cleanPhone,
          message: messageText,
          body: messageText,
        }),
      });
      if (res.ok) {
        console.log(`✅ Webhook Gateway: WhatsApp sent to ${cleanPhone}`);
        return true;
      }
    } catch (err: any) {
      console.warn("⚠️ WhatsApp Webhook error:", err.message);
    }
  }

  // Gateway 3: CallMeBot API (Fallback alert)
  const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
  if (callmebotApiKey && cleanPhone === normalizePhoneNumber(SHOP_OWNER_WHATSAPP_NUMBER)) {
    try {
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(
        messageText
      )}&apikey=${callmebotApiKey}`;
      await fetch(callmebotUrl);
      console.log(`✅ CallMeBot WhatsApp alert sent to ${cleanPhone}`);
      return true;
    } catch (err: any) {
      console.warn("⚠️ CallMeBot dispatch error:", err.message);
    }
  }

  console.log(`ℹ️ [WhatsApp Service] Ready for live gateway dispatch to ${cleanPhone}.`);
  return false;
}

/**
 * Sends notification to the Shop Owner
 */
export async function sendShopOwnerNotification(data: WhatsAppOrderData): Promise<string> {
  const whatsappUrl = generateShopOwnerWhatsAppUrl(data);
  const messageText = formatShopOwnerOrderMessage(data);
  await sendWhatsAppMessage(SHOP_OWNER_WHATSAPP_NUMBER, messageText);
  return whatsappUrl;
}

/**
 * Sends notification directly to the Customer's phone
 */
export async function sendCustomerNotification(data: WhatsAppOrderData): Promise<string> {
  const whatsappUrl = generateCustomerWhatsAppUrl(data);
  const messageText = formatCustomerOrderMessage(data);
  await sendWhatsAppMessage(data.customerPhone, messageText);
  return whatsappUrl;
}
