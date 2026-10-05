import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import { sendRegistrationOtpEmail } from "../services/emailService.js";
import { config } from "../config/env.js";
import { AuthRequest } from "../middleware/auth.js";

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

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
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
        name: name.trim(),
        password,
        phone: phone ? phone.trim() : undefined,
      },
    });

    // Send the email (or log in terminal if SMTP not yet configured)
    await sendRegistrationOtpEmail(normalizedEmail, otpCode, name.trim());

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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

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

    req.user.addresses.push(req.body);
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

    // Update fields in place
    Object.assign(addr, req.body);
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
    const addr = (req.user.addresses as any).id(addressId);

    if (!addr) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    addr.deleteOne();
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
    const { email, email_verified, name, picture, sub } = payload;

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
