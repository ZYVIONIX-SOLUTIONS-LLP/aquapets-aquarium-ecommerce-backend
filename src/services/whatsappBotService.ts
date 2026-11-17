import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

let sock: WASocket | null = null;
let currentQrCode: string | null = null;
let currentQrDataUrl: string | null = null;
let connectionStatus: "disconnected" | "connecting" | "qr_ready" | "connected" = "disconnected";
let connectedNumber: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

const SESSION_DIR = path.join(process.cwd(), "whatsapp_session");

/**
 * Initializes the self-hosted WhatsApp Web Bot with persistent auth state
 */
export async function initWhatsAppBot() {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`🤖 [WhatsApp Bot] Initializing using WA Web v${version.join(".")} (Latest: ${isLatest})`);

    connectionStatus = "connecting";

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "silent" }) as any,
      browser: ["AquaPets Aquarium", "Chrome", "1.0.0"],
      syncFullHistory: false,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrCode = qr;
        connectionStatus = "qr_ready";
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
          await QRCode.toFile(path.join(process.cwd(), "..", "whatsapp_qr.png"), qr);
          console.log("\n📱 ========================================================");
          console.log("👉 WhatsApp Pairing QR Code is ready!");
          console.log("👉 Open http://localhost:5000/api/whatsapp/qr to scan with your phone");
          console.log("👉 OR open the image: d:\\zyvionix projects\\aqua-pets-aquarium\\whatsapp_qr.png");
          console.log("========================================================\n");
        } catch (err: any) {
          console.error("QR Code generation error:", err.message);
        }
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ [WhatsApp Bot] Connection closed. Status code: ${statusCode}. Should reconnect: ${shouldReconnect}`);

        connectionStatus = "disconnected";
        currentQrCode = null;
        currentQrDataUrl = null;
        connectedNumber = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("ℹ️ [WhatsApp Bot] Device logged out. Cleaning up session files...");
          try {
            if (fs.existsSync(SESSION_DIR)) {
              fs.rmSync(SESSION_DIR, { recursive: true, force: true });
            }
          } catch (cleanErr: any) {
            console.warn("Session cleanup warning:", cleanErr.message);
          }
        }

        if (shouldReconnect) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            console.log("🔄 [WhatsApp Bot] Reconnecting...");
            initWhatsAppBot();
          }, 5000);
        }
      } else if (connection === "open") {
        connectionStatus = "connected";
        currentQrCode = null;
        currentQrDataUrl = null;
        connectedNumber = sock?.user?.id?.split(":")[0] || sock?.user?.id || null;
        console.log(`\n✅ ========================================================`);
        console.log(`🎉 [WhatsApp Bot] Connected successfully!`);
        console.log(`📱 Linked Phone: +${connectedNumber}`);
        console.log(`========================================================\n`);
      }
    });

    sock.ev.on("creds.update", saveCreds);

  } catch (err: any) {
    console.error("❌ [WhatsApp Bot] Error initializing:", err.message);
    connectionStatus = "disconnected";
  }
}

/**
 * Sends a message through the connected WhatsApp Bot
 */
export async function sendBotMessage(recipientPhone: string, messageText: string): Promise<boolean> {
  if (!sock || connectionStatus !== "connected") {
    console.log(`ℹ️ [WhatsApp Bot] Not connected (status: ${connectionStatus}). Skipping native bot dispatch.`);
    return false;
  }

  try {
    const cleanNumber = recipientPhone.replace(/[^0-9]/g, "");
    const jid = `${cleanNumber}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: messageText });
    console.log(`✅ [WhatsApp Bot] Successfully sent message to ${cleanNumber}`);
    return true;
  } catch (err: any) {
    console.error(`❌ [WhatsApp Bot] Failed to send message to ${recipientPhone}:`, err.message);
    return false;
  }
}

/**
 * Returns current status and QR Code data URL
 */
export function getBotStatus() {
  return {
    status: connectionStatus,
    connectedNumber,
    qrCodeDataUrl: currentQrDataUrl,
    hasSession: fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0,
  };
}

/**
 * Force disconnects and resets the session
 */
export async function resetBotSession() {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock = null;
    }
  } catch (_) {}

  connectionStatus = "disconnected";
  currentQrCode = null;
  currentQrDataUrl = null;
  connectedNumber = null;

  try {
    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }
  } catch (_) {}

  setTimeout(() => {
    initWhatsAppBot();
  }, 1000);

  return { success: true, message: "Session reset. New QR code generating..." };
}
