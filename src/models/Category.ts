import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  iconName: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    productCount: { type: Number, default: 0 },
    iconName: { type: String, default: "Fish" },
    sortOrder: { type: Number, default: 99 },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory>("Category", categorySchema);
