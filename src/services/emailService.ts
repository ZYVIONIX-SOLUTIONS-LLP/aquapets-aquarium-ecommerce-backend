import nodemailer from "nodemailer";
import { config } from "../config/env.js";

// Reloaded Gmail SMTP Config

/**
 * Creates and returns a Nodemailer transporter if SMTP credentials are provided
 */
const getTransporter = () => {
  if (!config.email.smtpUser || !config.email.smtpPass) {
    return null;
  }

  const cleanPass = config.email.smtpPass.replace(/\s+/g, "");

  if (config.email.smtpHost.includes("gmail")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.smtpUser,
        pass: cleanPass,
      },
    });
  }

  return nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465,
    auth: {
      user: config.email.smtpUser,
      pass: cleanPass,
    },
  });
};

/**
 * Sends a 6-digit registration OTP email to the user
 */
export const sendRegistrationOtpEmail = async (
  toEmail: string,
  otp: string,
  userName: string
): Promise<{ success: boolean; simulated?: boolean; message?: string }> => {
  // Always log prominently in development console for instant developer feedback
  console.log("\n=======================================================");
  console.log("🐠 [AQUAPETS REGISTRATION VERIFICATION CODE]");
  console.log(`👤 Name:     ${userName}`);
  console.log(`📧 To:       ${toEmail}`);
  console.log(`🔐 OTP CODE: >>> ${otp} <<<`);
  console.log("⏰ Valid:    10 minutes");
  console.log("=======================================================\n");

  const transporter = getTransporter();

  // If no SMTP configured yet, return simulated success so local dev works seamlessly
  if (!transporter) {
    console.log(
      "ℹ️  [SMTP Info]: SMTP_USER or SMTP_PASS not configured in .env. Email simulated successfully above."
    );
    return {
      success: true,
      simulated: true,
      message: "OTP generated (simulated in development mode)",
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f8f8; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #06233a; padding: 28px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
          .header p { color: #14b8c4; font-size: 13px; margin: 6px 0 0 0; font-weight: 600; }
          .body { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: bold; color: #06233a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .otp-box { background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border: 2px dashed #14b8c4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #06233a; font-family: 'Courier New', Courier, monospace; }
          .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
          .footer { background: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AquaPets Aquarium</h1>
            <p>Verification Code</p>
          </div>
          <div class="body">
            <div class="greeting">Hello ${userName},</div>
            <div class="text">
              Thank you for signing up with AquaPets Aquarium! Please use the 6-digit verification code below to activate your account.
            </div>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱️ Valid for 10 minutes only</div>
            </div>
            <div class="text" style="font-size: 12px; color: #64748b;">
              If you did not request this verification code, please ignore this email or contact support if you have concerns.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AquaPets Aquarium. All rights reserved.<br/>
            This is an automated security message. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: toEmail,
      subject: `${otp} is your AquaPets Aquarium verification code`,
      text: `Hello ${userName},\n\nYour AquaPets Aquarium verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nThank you,\nAquaPets Aquarium Team`,
      html: htmlContent,
    });

    console.log(`✅ [Email Service] OTP successfully sent to ${toEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error(`❌ [Email Service Error]:`, err.message);
    throw new Error(`Failed to send verification email: ${err.message}`);
  }
};

/**
 * Sends a newsletter email to subscribers
 */
export const sendNewsletterEmail = async (
  recipients: string[],
  subject: string,
  content: string
): Promise<{ success: boolean; sentCount: number; simulated?: boolean }> => {
  console.log("\n=======================================================");
  console.log("📢 [AQUAPETS NEWSLETTER BROADCAST]");
  console.log(`📧 Recipients (${recipients.length}):`, recipients.join(", "));
  console.log(`📝 Subject:  ${subject}`);
  console.log(`📄 Message:\n${content}`);
  console.log("=======================================================\n");

  const transporter = getTransporter();

  if (!transporter) {
    console.log("ℹ️  [SMTP Info]: SMTP_USER or SMTP_PASS not configured in .env. Broadcast email simulated in logs.");
    return { success: true, sentCount: recipients.length, simulated: true };
  }

  const formattedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f8f8; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: #06233a; padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 900; }
          .header p { color: #14b8c4; font-size: 13px; margin: 4px 0 0 0; font-weight: 700; }
          .body { padding: 32px 28px; line-height: 1.7; color: #334155; font-size: 14px; }
          .content-box { background: #f8fafc; border-left: 4px solid #14b8c4; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
          .cta-btn { display: inline-block; background: #14b8c4; color: #06233a; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-top: 16px; text-align: center; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AquaPets Aquarium</h1>
            <p>Newsletter Update</p>
          </div>
          <div class="body">
            <h2 style="color: #06233a; font-size: 18px; margin-top: 0;">${subject}</h2>
            <div class="content-box">${content}</div>
            <a href="${config.clientUrl}/shop" class="cta-btn">Visit Storefront →</a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AquaPets Aquarium. All rights reserved.<br/>
            You received this email because you subscribed to AquaPets updates.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      replyTo: config.email.fromEmail,
      to: recipients.join(", "),
      subject,
      text: content,
      html: formattedHtml,
    });
    return { success: true, sentCount: recipients.length };
  } catch (err: any) {
    console.error("❌ [Newsletter Email Error]:", err);
    throw new Error(err.message || "Failed to send newsletter email");
  }
};

/**
 * Sends a 6-digit password reset OTP email to the user
 */
export const sendPasswordResetOtpEmail = async (
  toEmail: string,
  otp: string,
  userName: string
): Promise<{ success: boolean; simulated?: boolean; message?: string }> => {
  console.log("\n=======================================================");
  console.log("🔐 [AQUAPETS PASSWORD RESET CODE]");
  console.log(`👤 Name:     ${userName}`);
  console.log(`📧 To:       ${toEmail}`);
  console.log(`🔑 OTP CODE: >>> ${otp} <<<`);
  console.log("⏰ Valid:    10 minutes");
  console.log("=======================================================\n");

  const transporter = getTransporter();

  if (!transporter) {
    return {
      success: true,
      simulated: true,
      message: "Reset code generated (simulated in development mode)",
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f8f8; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #06233a; padding: 28px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
          .header p { color: #14b8c4; font-size: 13px; margin: 6px 0 0 0; font-weight: 600; }
          .body { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: bold; color: #06233a; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .otp-box { background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border: 2px dashed #14b8c4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #06233a; font-family: 'Courier New', Courier, monospace; }
          .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
          .footer { background: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AquaPets Aquarium</h1>
            <p>Password Reset Code</p>
          </div>
          <div class="body">
            <div class="greeting">Hello ${userName},</div>
            <div class="text">
              We received a request to reset your AquaPets account password. Please enter the 6-digit verification code below to set a new password.
            </div>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱️ Valid for 10 minutes only</div>
            </div>
            <div class="text" style="font-size: 12px; color: #64748b;">
              If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} AquaPets Aquarium. All rights reserved.<br/>
            This is an automated security message. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: toEmail,
      subject: `Your AquaPets Password Reset Code: ${otp}`,
      text: `Hello ${userName},\n\nYour AquaPets password reset code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this message.`,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.warn("⚠️ [SMTP Warning]: Failed to send password reset email via SMTP, logged in console instead.", err.message);
    return { success: true, simulated: true };
  }
};
