import { Router, Request, Response } from "express";
import { getBotStatus, resetBotSession, sendBotMessage } from "../services/whatsappBotService.js";
import { SHOP_OWNER_WHATSAPP_NUMBER, normalizePhoneNumber } from "../services/whatsappService.js";

const router = Router();

/**
 * GET /api/whatsapp/status
 * Returns current connection status
 */
router.get("/status", (req: Request, res: Response) => {
  const status = getBotStatus();
  res.json({
    success: true,
    data: status,
    targetShopOwnerNumber: SHOP_OWNER_WHATSAPP_NUMBER,
  });
});

/**
 * POST /api/whatsapp/reset
 * Clears current session and generates a fresh QR code
 */
router.post("/reset", async (req: Request, res: Response) => {
  const result = await resetBotSession();
  res.json(result);
});

/**
 * POST /api/whatsapp/test
 * Sends a test WhatsApp order alert to verify end-to-end delivery
 */
router.post("/test", async (req: Request, res: Response) => {
  const targetPhone = req.body.phone || SHOP_OWNER_WHATSAPP_NUMBER;
  const cleanPhone = normalizePhoneNumber(targetPhone);

  const testMessage =
    `🐠 *AQUA PETS AQUARIUM — WHATSAPP BOT CONNECTED!* 🐠\n\n` +
    `Hello! This is a test confirmation from your automated store notification system.\n\n` +
    `✅ *Status:* Real-time order alerts are ACTIVE.\n` +
    `⏰ *Time:* ${new Date().toLocaleString("en-IN")}\n` +
    `📱 *Receiving Number:* +${cleanPhone}\n\n` +
    `Every time a customer completes an order on aquapetsaquarium.com, you will receive full customer address, items list, and dispatch mode right here automatically! 🌿🐟`;

  const sent = await sendBotMessage(cleanPhone, testMessage);
  if (sent) {
    res.json({
      success: true,
      message: `Test message sent successfully to +${cleanPhone}!`,
    });
  } else {
    res.status(500).json({
      success: false,
      message: `Failed to send. Please make sure the WhatsApp bot is connected (status: ${getBotStatus().status}).`,
    });
  }
});

/**
 * POST /api/whatsapp/test-courier
 * Sends a real-world formatted Courier Order alert
 */
router.post("/test-courier", async (req: Request, res: Response) => {
  const { sendShopOwnerNotification } = await import("../services/whatsappService.js");
  try {
    const url = await sendShopOwnerNotification({
      orderNumber: "AQ-812349",
      customerName: "Rahul Sharma",
      customerPhone: "+91 94471 22334",
      shippingAddress: {
        houseBuilding: "Palm Grove, Apt 4B",
        street: "Kaloor - Kadavanthra Road",
        city: "Kochi",
        state: "Kerala",
        pincode: "682017",
      },
      items: [
        { name: "Sobo Internal Filter WP-300F", quantity: 1, price: 550 },
        { name: "Hikari Algae Wafers 82g", quantity: 2, price: 420 },
        { name: "AquaScape Tweezers 27cm", quantity: 1, price: 280 },
      ],
      subtotal: 1670,
      deliveryFee: 90,
      total: 1760,
      paymentMethod: "ONLINE (Razorpay PAID)",
      deliveryMethod: "courier",
      notes: "Please pack aquatic plants carefully with moist padding",
    });
    res.json({ success: true, message: "Courier test order dispatched to WhatsApp!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/whatsapp/test-porter
 * Sends a real-world formatted Porter Urgent Local order alert
 */
router.post("/test-porter", async (req: Request, res: Response) => {
  const { sendShopOwnerNotification } = await import("../services/whatsappService.js");
  try {
    const url = await sendShopOwnerNotification({
      orderNumber: "AQ-954120",
      customerName: "Dr. Anoop Nair",
      customerPhone: "+91 94471 88990",
      shippingAddress: {
        houseBuilding: "Nair Clinic, 2nd Floor",
        street: "MG Road, Ravipuram",
        city: "Ernakulam",
        state: "Kerala",
        pincode: "682015",
      },
      items: [
        { name: "Ultra-Clear Glass Tank 2ft (60L)", quantity: 1, price: 3499 },
        { name: "Aquarium LED Planted Light 18W", quantity: 1, price: 850 },
      ],
      subtotal: 4349,
      deliveryFee: 0,
      total: 4349,
      paymentMethod: "ONLINE (Razorpay PAID)",
      deliveryMethod: "porter",
      notes: "Fragile Glass! Porter 2-Wheeler delivery requested for same-day delivery.",
    });
    res.json({ success: true, message: "Porter test order dispatched to WhatsApp!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/whatsapp/qr
 * Live web pairing page with auto-refresh
 */
router.get("/qr", (req: Request, res: Response) => {
  const status = getBotStatus();

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aqua Pets - WhatsApp Order Bot</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 36px 32px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .badge-connected { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .badge-waiting { background: #78350f; color: #fbbf24; border: 1px solid #d97706; }
    .badge-connecting { background: #1e3a8a; color: #60a5fa; border: 1px solid #2563eb; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #38bdf8; }
    p.subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }
    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 16px;
      display: inline-block;
      margin: 16px 0;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    }
    .qr-box img { display: block; width: 240px; height: 240px; }
    .steps {
      text-align: left;
      background: #0f172a;
      padding: 16px;
      border-radius: 12px;
      font-size: 13px;
      color: #cbd5e1;
      margin: 20px 0;
      line-height: 1.6;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px 20px;
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      transition: background 0.2s;
    }
    .btn:hover { background: #0369a1; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #38bdf8;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      margin: 30px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card" id="app">
    <div id="loading" class="spinner"></div>
    <div id="content" style="display:none;"></div>
  </div>

  <script>
    async function checkStatus() {
      try {
        const res = await fetch('/api/whatsapp/status');
        const json = await res.json();
        const data = json.data;

        const loading = document.getElementById('loading');
        const content = document.getElementById('content');
        loading.style.display = 'none';
        content.style.display = 'block';

        if (data.status === 'connected') {
          content.innerHTML = \`
            <div class="badge badge-connected">● ONLINE & CONNECTED</div>
            <h1>Aqua Pets WhatsApp Bot</h1>
            <p class="subtitle">Connected to WhatsApp: <strong>+\${data.connectedNumber}</strong></p>
            <div style="font-size: 64px; margin: 20px 0;">🐠 ✅</div>
            <div class="steps">
              ✅ <strong>Active:</strong> Real-time order alerts are delivering directly to <strong>+${SHOP_OWNER_WHATSAPP_NUMBER}</strong>.<br>
              Every new customer order will trigger an instant WhatsApp message!
            </div>
            <button class="btn" style="background:#0284c7;" onclick="sendOrderTest('courier')">📦 Send Test Courier Order</button>
            <button class="btn" style="background:#d97706;" onclick="sendOrderTest('porter')">🛵 Send Test Porter Urgent Order</button>
            <button class="btn btn-secondary" onclick="resetSession()">Disconnect & Link Another Phone</button>
          \`;
        } else if (data.status === 'qr_ready' && data.qrCodeDataUrl) {
          content.innerHTML = \`
            <div class="badge badge-waiting">● WAITING FOR SCAN</div>
            <h1>Link Aqua Pets WhatsApp</h1>
            <p class="subtitle">Scan this QR code with WhatsApp on your phone</p>
            <div class="qr-box">
              <img src="\${data.qrCodeDataUrl}" alt="WhatsApp QR Code" />
            </div>
            <div class="steps">
              1. Open WhatsApp on your phone<br>
              2. Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong><br>
              3. Tap <strong>Linked Devices</strong> → <strong>Link a Device</strong><br>
              4. Point your camera at this QR code
            </div>
            <p style="font-size:12px; color:#64748b;">This page updates automatically once scanned.</p>
          \`;
        } else {
          content.innerHTML = \`
            <div class="badge badge-connecting">● INITIALIZING...</div>
            <h1>Starting WhatsApp Engine</h1>
            <p class="subtitle">Generating pairing session, please wait 3 seconds...</p>
            <div class="spinner"></div>
          \`;
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function sendOrderTest(type) {
      const btn = event.target;
      const originalText = btn.innerText;
      btn.disabled = true;
      btn.innerText = 'Sending alert...';
      try {
        const endpoint = type === 'porter' ? '/api/whatsapp/test-porter' : '/api/whatsapp/test-courier';
        const res = await fetch(endpoint, { method: 'POST' });
        const json = await res.json();
        alert(json.message);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    }

    async function resetSession() {
      if (!confirm('Are you sure you want to disconnect this phone?')) return;
      await fetch('/api/whatsapp/reset', { method: 'POST' });
      alert('Session reset. Generating new QR code...');
      setTimeout(checkStatus, 1500);
    }

    setInterval(checkStatus, 3000);
    checkStatus();
  </script>
</body>
</html>
  `);
});

export default router;

