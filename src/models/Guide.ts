import { Schema, model, Document } from "mongoose";

export interface IGuide extends Document {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: "Beginner Guides" | "Water Care" | "Aquascaping" | "Fish Care" | "Plants Guide" | "Equipment Guide" | "Troubleshooting";
  readTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  image: string;
  videoUrl?: string;
  isFeatured: boolean;
  publishDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const guideSchema = new Schema<IGuide>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["Beginner Guides", "Water Care", "Aquascaping", "Fish Care", "Plants Guide", "Equipment Guide", "Troubleshooting"],
      required: true,
      index: true,
    },
    readTime: { type: String, default: "5 min read" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    image: { type: String, required: true },
    videoUrl: { type: String },
    isFeatured: { type: Boolean, default: false, index: true },
    publishDate: { type: String, default: () => new Date().toISOString().split("T")[0] },
  },
  {
    timestamps: true,
  }
);

export const Guide = model<IGuide>("Guide", guideSchema);
