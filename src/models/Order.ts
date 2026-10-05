import { Schema, model, Document, Types } from "mongoose";
import { IAddress } from "./User.js";

export interface IOrderItem {
  productId: Types.ObjectId;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedVariant?: string;
  weightKg?: number;
}

export interface IShiprocketDetails {
  orderId?: number;
  shipmentId?: number;
  awbCode?: string;
  courierCompanyId?: number;
  courierName?: string;
  pickupScheduledDate?: string;
  pickupTokenNumber?: string;
  labelUrl?: string;
  manifestUrl?: string;
  trackingUrl?: string;
  status?: string;
  statusCode?: number;
  lastTrackedAt?: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  totalAmount?: number;
  paymentMethod: "Razorpay" | "Cash on Delivery";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "Pending" | "Paid" | "Failed" | "Refunded";
  orderStatus: "CREATED" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "Placed" | "Confirmed" | "Processing" | "Packed" | "Out for Delivery" | "Delivered" | "Cancelled";
  shiprocket: IShiprocketDetails;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedVariant: { type: String },
  weightKg: { type: Number, default: 0.5 },
});

const shiprocketDetailsSchema = new Schema<IShiprocketDetails>({
  orderId: { type: Number },
  shipmentId: { type: Number },
  awbCode: { type: String, index: true },
  courierCompanyId: { type: Number },
  courierName: { type: String },
  pickupScheduledDate: { type: String },
  pickupTokenNumber: { type: String },
  labelUrl: { type: String },
  manifestUrl: { type: String },
  trackingUrl: { type: String },
  status: { type: String, default: "NEW" },
  statusCode: { type: Number },
  lastTrackedAt: { type: Date },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, required: true },
      houseBuilding: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    totalAmount: { type: Number },
    paymentMethod: { type: String, enum: ["Razorpay", "Cash on Delivery"], default: "Razorpay" },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "Pending", "Paid", "Failed", "Refunded"],
      default: "PENDING",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["CREATED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "Placed", "Confirmed", "Processing", "Packed", "Out for Delivery", "Delivered", "Cancelled"],
      default: "CREATED",
      index: true,
    },
    shiprocket: { type: shiprocketDetailsSchema, default: () => ({}) },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrder>("Order", orderSchema);
