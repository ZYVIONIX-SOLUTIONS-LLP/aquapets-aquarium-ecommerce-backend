import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  getProfile,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);
router.post("/resend-registration-otp", resendRegistrationOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);
router.get("/profile", authenticate, getProfile);
router.post("/address", authenticate, addAddress);
router.put("/address/:addressId", authenticate, updateAddress);
router.delete("/address/:addressId", authenticate, deleteAddress);

export default router;
