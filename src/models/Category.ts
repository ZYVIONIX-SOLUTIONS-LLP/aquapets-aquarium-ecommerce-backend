import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  iconName: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "/categories/aquariums-tanks.jpg" },
    productCount: { type: Number, default: 0 },
    iconName: { type: String, default: "Fish" },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 99 },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory>("Category", categorySchema);
