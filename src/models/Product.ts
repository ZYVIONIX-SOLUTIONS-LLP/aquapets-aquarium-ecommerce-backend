import { Schema, model, Document } from "mongoose";

export interface IProductSpecification {
  label: string;
  value: string;
}

export interface IProduct extends Document {
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  fullDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  stock: number;
  badge?: "Best Seller" | "Sale" | "New" | "Popular" | "Combo" | "Top Pick";
  specifications: IProductSpecification[];
  tags: string[];
  isFeatured: boolean;
  isStarterKit: boolean;
  isOffer: boolean;
  offerType?: "Discount" | "Buy 1 Get 1" | "Buy 2 Get 1" | "Bundle Offer" | "Combo Deal" | "Limited Time";
  tankType?: "Freshwater" | "Planted Tank" | "Marine" | "Nano";
  weightKg?: number;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    fullDescription: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    specifications: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false, index: true },
    isStarterKit: { type: Boolean, default: false, index: true },
    isOffer: { type: Boolean, default: false, index: true },
    offerType: {
      type: String,
      enum: ["Discount", "Buy 1 Get 1", "Buy 2 Get 1", "Bundle Offer", "Combo Deal", "Limited Time", null, ""],
    },
    tankType: {
      type: String,
      enum: ["Freshwater", "Planted Tank", "Marine", "Nano", null, ""],
      index: true,
    },
    weightKg: { type: Number, default: 0.5 },
    dimensions: {
      length: { type: Number, default: 10 },
      breadth: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: "text", description: "text", brand: "text", tags: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ isOffer: 1, createdAt: -1 });
productSchema.index({ isStarterKit: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });

export const Product = model<IProduct>("Product", productSchema);
