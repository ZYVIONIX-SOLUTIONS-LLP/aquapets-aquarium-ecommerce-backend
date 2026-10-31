import { Schema, model, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  tempUserData: {
    name: string;
    password: string;
    phone?: string;
  };
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    tempUserData: {
      name: { type: String, required: true },
      password: { type: String, default: "" },
      phone: { type: String },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // MongoDB TTL index: automatically deletes document after 10 minutes (600s)
    },
  },
  {
    timestamps: false,
  }
);

export const Otp = model<IOtp>("Otp", otpSchema);
