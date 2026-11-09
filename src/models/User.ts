import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAddress {
  _id?: Types.ObjectId;
  fullName: string;
  email?: string;
  phone: string;
  houseBuilding: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  addressType?: string;
}

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  selectedVariant?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: "customer" | "admin";
  googleId?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  addresses: IAddress[];
  wishlist: Types.ObjectId[];
  cart: ICartItem[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
  fullName: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, required: true },
  houseBuilding: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  addressType: { type: String, default: "HOME" },
});

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    selectedVariant: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    googleId: { type: String, sparse: true, index: true },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    addresses: [addressSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product", default: [] }],
    cart: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", userSchema);
