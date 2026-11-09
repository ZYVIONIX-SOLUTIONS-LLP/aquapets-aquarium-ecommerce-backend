import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { sendRegistrationOtpEmail, sendPasswordResetOtpEmail } from "../services/emailService.js";
import { config } from "../config/env.js";
import { AuthRequest } from "../middleware/auth.js";
import { validatePhoneNumber, validateFullName, validatePasswordStrength } from "../utils/phone.js";

const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
};

/**
 * Step 1: Initiates registration by creating temporary OTP and sending email
 * POST /api/auth/send-registration-otp
 */
export const sendRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required" });
      return;
    }

    // Validate full name (letters and spaces only)
    const nameValidation = validateFullName(name);
    if (!nameValidation.isValid) {
      res.status(400).json({ success: false, message: nameValidation.error });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({ success: false, message: passwordValidation.error });
      return;
    }

    // Validate phone number if provided (phone is optional)
    const phoneValidation = validatePhoneNumber(phone, false);
    if (!phoneValidation.isValid) {
      res.status(400).json({ success: false, message: phoneValidation.error });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    // Rate-limit check: do not spam if requested within last 60 seconds
    const existingOtp = await Otp.findOne({ email: normalizedEmail });
    if (existingOtp) {
      const elapsedMs = Date.now() - existingOtp.createdAt.getTime();
      if (elapsedMs < 60000) {
        const waitSec = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          success: false,
          message: `Please wait ${waitSec}s before requesting a new verification code`,
          retryAfter: waitSec,
        });
        return;
      }
      await Otp.deleteMany({ email: normalizedEmail });
    }

    // Generate 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save temporary registration details in Otp collection (auto-deletes after 10m)
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      tempUserData: {
        name: nameValidation.cleanName!,
        password,
        phone: phoneValidation.cleanPhone,
      },
    });

    // Send the email (or log in terminal if SMTP not yet configured)
    await sendRegistrationOtpEmail(normalizedEmail, otpCode, nameValidation.cleanName!);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verifies the 6-digit OTP and creates the customer in MongoDB
 * POST /api/auth/verify-registration-otp
 */
export const verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and 6-digit code are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: "Verification code expired or not found. Please request a new code.",
      });
      return;
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: normalizedEmail });
      res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new verification code.",
      });
      return;
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
      return;
    }

    // OTP is valid! Create the verified user
    const newUser = await User.create({
      name: otpRecord.tempUserData.name,
      email: normalizedEmail,
      password: otpRecord.tempUserData.password,
      phone: otpRecord.tempUserData.phone,
      role: "customer",
      isEmailVerified: true,
    });

    // Clean up OTP record
    await Otp.deleteMany({ email: normalizedEmail });

    // Generate JWT token
    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      success: true,
      message: "Account verified and created successfully!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        addresses: newUser.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 3: Resend registration OTP with cooldown
 * POST /api/auth/resend-registration-otp
 */
export const resendRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: "Registration session expired. Please fill out the registration form again.",
      });
      return;
    }

    const elapsedMs = Date.now() - otpRecord.createdAt.getTime();
    if (elapsedMs < 60000) {
      const waitSec = Math.ceil((60000 - elapsedMs) / 1000);
      res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before resending code`,
        retryAfter: waitSec,
      });
      return;
    }

    // Generate fresh 6-digit code
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpRecord.otp = newOtp;
    otpRecord.createdAt = new Date();
    otpRecord.attempts = 0;
    await otpRecord.save();

    await sendRegistrationOtpEmail(normalizedEmail, newOtp, otpRecord.tempUserData.name);

    res.status(200).json({
      success: true,
      message: `A new 6-digit code has been sent to ${normalizedEmail}`,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email, and password are required" });
      return;
    }

    // Validate full name (letters and spaces only)
    const nameValidation = validateFullName(name);
    if (!nameValidation.isValid) {
      res.status(400).json({ success: false, message: nameValidation.error });
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({ success: false, message: passwordValidation.error });
      return;
    }

    const phoneValidation = validatePhoneNumber(phone, false);
    if (!phoneValidation.isValid) {
      res.status(400).json({ success: false, message: phoneValidation.error });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    const user = await User.create({
      name: nameValidation.cleanName!,
      email: email.toLowerCase(),
      password,
      phone: phoneValidation.cleanPhone,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// In-memory brute-force rate limiter for authentication
interface LoginAttemptRecord {
  count: number;
  lockedUntil?: number;
  firstFailedAt: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();

// Periodic cleanup of expired records every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      loginAttempts.delete(key);
    } else if (now - record.firstFailedAt > 30 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 15 * 60 * 1000).unref();

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, identifier: rawIdentifier, password } = req.body;
    const identifier = String(email || rawIdentifier || "").trim();

    if (!identifier || !password) {
      res.status(400).json({ success: false, message: "Email or phone number, and password are required" });
      return;
    }

    // Rate-limiting check by client IP & normalized identifier
    const clientIp = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip || "unknown").split(",")[0].trim();
    const rateLimitKey = `${clientIp}:${identifier.toLowerCase()}`;
    const attempt = loginAttempts.get(rateLimitKey);
    const now = Date.now();

    if (attempt && attempt.lockedUntil && attempt.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Account access is temporarily locked for security. Please try again in ${remainingMinutes} minute(s).`,
        retryAfter: Math.ceil((attempt.lockedUntil - now) / 1000),
      });
      return;
    }

    const isEmail = identifier.includes("@");
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : {
          $or: [
            { phone: identifier },
            { phone: identifier.replace(/\D/g, "") },
            { email: identifier.toLowerCase() },
          ],
        };

    const user = await User.findOne(query).select("+password");
    const isPasswordValid = user ? await user.comparePassword(password) : false;

    if (!user || !isPasswordValid) {
      const currentAttempt = loginAttempts.get(rateLimitKey) || {
        count: 0,
        firstFailedAt: now,
      };

      currentAttempt.count += 1;

      if (currentAttempt.count >= 5) {
        currentAttempt.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
        loginAttempts.set(rateLimitKey, currentAttempt);

        res.status(429).json({
          success: false,
          message: "Too many failed login attempts. Access is temporarily locked for 15 minutes for your security.",
          retryAfter: 900,
        });
        return;
      }

      loginAttempts.set(rateLimitKey, currentAttempt);
      const remaining = 5 - currentAttempt.count;

      res.status(401).json({
        success: false,
        message: "Invalid credentials",
        remainingAttempts: remaining,
      });
      return;
    }

    // Successful login: clear any failed attempt history
    loginAttempts.delete(rateLimitKey);

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 1 of Password Reset: Request 6-digit OTP to email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email address is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: "No AquaPets account found with this email" });
      return;
    }

    // Rate-limit check: do not spam if requested within last 60 seconds
    const existingOtp = await Otp.findOne({ email: normalizedEmail });
    if (existingOtp) {
      const elapsedMs = Date.now() - existingOtp.createdAt.getTime();
      if (elapsedMs < 60000) {
        const waitSec = Math.ceil((60000 - elapsedMs) / 1000);
        res.status(429).json({
          success: false,
          message: `Please wait ${waitSec}s before requesting a new code`,
          retryAfter: waitSec,
        });
        return;
      }
      await Otp.deleteMany({ email: normalizedEmail });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      tempUserData: {
        name: user.name,
      },
    });

    await sendPasswordResetOtpEmail(normalizedEmail, otpCode, user.name);

    res.json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${normalizedEmail}`,
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2 of Password Reset: Verify OTP and save new password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: "Email, reset code, and new password are required" });
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({ success: false, message: passwordValidation.error });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: "Reset code expired or not found. Please request a new code.",
      });
      return;
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteMany({ email: normalizedEmail });
      res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
      return;
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      res.status(400).json({
        success: false,
        message: `Incorrect reset code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
      return;
    }

    // Update user password
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteMany({ email: normalizedEmail });

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: "Password reset successfully! You are now signed in.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      fullName,
      phone,
      houseBuilding,
      street,
      city,
      state = "Kerala",
      pincode,
      addressType = "HOME",
      isDefault = false,
      email = req.user.email || "",
    } = req.body;

    if (!fullName || !phone || !houseBuilding || !street || !city || !pincode) {
      res.status(400).json({ success: false, message: "All required address fields must be provided" });
      return;
    }

    const nameValidation = validateFullName(fullName);
    if (!nameValidation.isValid) {
      res.status(400).json({ success: false, message: nameValidation.error });
      return;
    }

    const phoneValidation = validatePhoneNumber(phone, true);
    if (!phoneValidation.isValid) {
      res.status(400).json({ success: false, message: phoneValidation.error });
      return;
    }

    if (isDefault || req.user.addresses.length === 0) {
      req.user.addresses.forEach((a) => (a.isDefault = false));
    }

    req.user.addresses.push({
      fullName: nameValidation.cleanName!,
      email: String(email).trim(),
      phone: phoneValidation.cleanPhone!,
      houseBuilding: String(houseBuilding).trim(),
      street: String(street).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      addressType,
      isDefault: isDefault || req.user.addresses.length === 0,
    });

    await req.user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      addresses: req.user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { addressId } = req.params;
    const addr = (req.user.addresses as any).id(addressId);

    if (!addr) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    if (req.body.isDefault) {
      req.user.addresses.forEach((a) => (a.isDefault = false));
    }

    if (req.body.fullName) {
      const nameValidation = validateFullName(req.body.fullName);
      if (!nameValidation.isValid) {
        res.status(400).json({ success: false, message: nameValidation.error });
        return;
      }
      addr.fullName = nameValidation.cleanName!;
    }
    if (req.body.phone) {
      const phoneValidation = validatePhoneNumber(req.body.phone, true);
      if (!phoneValidation.isValid) {
        res.status(400).json({ success: false, message: phoneValidation.error });
        return;
      }
      addr.phone = phoneValidation.cleanPhone!;
    }
    if (req.body.houseBuilding) addr.houseBuilding = String(req.body.houseBuilding).trim();
    if (req.body.street) addr.street = String(req.body.street).trim();
    if (req.body.city) addr.city = String(req.body.city).trim();
    if (req.body.state) addr.state = String(req.body.state).trim();
    if (req.body.pincode) addr.pincode = String(req.body.pincode).trim();
    if (req.body.addressType) addr.addressType = req.body.addressType;
    if (req.body.email !== undefined) addr.email = String(req.body.email).trim();
    if (req.body.isDefault !== undefined) addr.isDefault = Boolean(req.body.isDefault);

    await req.user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      addresses: req.user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { addressId } = req.params;
    const initialLen = req.user.addresses.length;
    (req.user.addresses as any).pull({ _id: addressId });
    if (req.user.addresses.length === initialLen) {
      req.user.addresses = req.user.addresses.filter((a: any) => a._id?.toString() !== addressId);
    }
    await req.user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
      addresses: req.user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth Authentication Handler
 * Verifies Google ID token, finds or creates user, and issues AquaPets JWT
 */
export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: "Google ID credential is required" });
      return;
    }

    // Verify token with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      res.status(401).json({ success: false, message: "Invalid or expired Google token" });
      return;
    }

    const payload: any = await googleRes.json();
    const { email, email_verified, name, picture, sub, aud } = payload;

    // Validate Google Client ID Audience to prevent cross-app token reuse
    const expectedClientId = config.googleClientId || process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && aud && aud !== expectedClientId) {
      console.warn(`⚠️ Google Auth audience mismatch: token aud='${aud}', expected='${expectedClientId}'`);
      res.status(401).json({ success: false, message: "Unauthorized Google client audience" });
      return;
    }

    if (!email || (email_verified !== "true" && email_verified !== true)) {
      res.status(400).json({ success: false, message: "Google account email is not verified" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      let updated = false;
      if (!user.googleId && sub) {
        user.googleId = sub;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId: sub,
        avatar: picture,
        role: "customer",
      });
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
      },
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          addresses: user.addresses,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
