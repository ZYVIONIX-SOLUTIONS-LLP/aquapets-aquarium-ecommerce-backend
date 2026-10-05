/**
 * WhatsApp Notification Service for Aqua Pets Backend & Shop Owner
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
  }>;
  total: number;
  paymentMethod: string;
  notes?: string;
}

export const SHOP_OWNER_WHATSAPP_NUMBER = process.env.SHOP_OWNER_WHATSAPP || "916238392582";

export function formatShopOwnerOrderMessage(data: WhatsAppOrderData): string {
  const itemsText = data.items
    .map(
      (item, i) =>
        `   ${i + 1}. *${item.name}* (Qty: ${item.quantity}) - ₹${(
          item.price * item.quantity
        ).toLocaleString("en-IN")}`
    )
    .join("\n");

  return (
    `🔔 *NEW ORDER RECEIVED - SHOP OWNER ALERT* 🔔\n\n` +
    `📌 *Order Number:* #${data.orderNumber}\n` +
    `👤 *Customer Name:* ${data.customerName}\n` +
    `📞 *Customer Contact:* ${data.customerPhone}\n` +
    `📍 *Delivery Address:* ${data.shippingAddress.houseBuilding}, ${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}\n\n` +
    `🛒 *Items Ordered:*\n${itemsText}\n\n` +
    `💳 *Total Amount:* ₹${data.total.toLocaleString("en-IN")}\n` +
    `💰 *Payment Method:* ${data.paymentMethod}\n` +
    `🚚 *Notes:* ${data.notes || "Standard Shipping"}\n\n` +
    `⏰ *Placed At:* ${new Date().toLocaleString("en-IN")}\n\n` +
    `Aqua Pets Storefront Automated System 🐠`
  );
}

export function generateShopOwnerWhatsAppUrl(data: WhatsAppOrderData): string {
  const rawText = formatShopOwnerOrderMessage(data);
  const targetNumber = SHOP_OWNER_WHATSAPP_NUMBER.replace(/[^0-9]/g, "");
  return `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encodeURIComponent(rawText)}`;
}

export async function sendShopOwnerNotification(data: WhatsAppOrderData): Promise<string> {
  const whatsappUrl = generateShopOwnerWhatsAppUrl(data);
  const messageText = formatShopOwnerOrderMessage(data);

  // 1. If custom Webhook URL (UltraMsg / Twilio / GreenAPI / Meta Cloud API Gateway) is provided in .env
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: SHOP_OWNER_WHATSAPP_NUMBER,
          message: messageText,
        }),
      });
      console.log(`✅ Automated WhatsApp alert sent to shop owner (${SHOP_OWNER_WHATSAPP_NUMBER}) via webhook.`);
    } catch (err: any) {
      console.warn("⚠️ WhatsApp Webhook error:", err.message);
    }
  }

  // 2. If CallMeBot API key is provided in .env (Free instant WhatsApp alert API)
  const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
  if (callmebotApiKey) {
    try {
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${SHOP_OWNER_WHATSAPP_NUMBER}&text=${encodeURIComponent(
        messageText
      )}&apikey=${callmebotApiKey}`;
      await fetch(callmebotUrl);
      console.log(`✅ CallMeBot WhatsApp alert sent to shop owner (${SHOP_OWNER_WHATSAPP_NUMBER}).`);
    } catch (err: any) {
      console.warn("⚠️ CallMeBot dispatch error:", err.message);
    }
  }

  return whatsappUrl;
}
