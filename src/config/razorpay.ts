import Razorpay from "razorpay";
import { config } from "./env.js";

export const razorpayInstance = new Razorpay({
  key_id: config.razorpay.keyId || "rzp_test_dummy",
  key_secret: config.razorpay.keySecret || "dummy_secret",
});
