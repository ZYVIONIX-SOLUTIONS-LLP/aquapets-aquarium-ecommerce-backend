import { Request, Response, NextFunction } from "express";
import { Guide } from "../models/Guide.js";

export const getGuides = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, difficulty, isFeatured } = req.query;
    const query: Record<string, any> = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (isFeatured === "true") query.isFeatured = true;

    const guides = await Guide.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: guides,
    });
  } catch (error) {
    next(error);
  }
};

export const getGuideBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const guide = await Guide.findOne({ slug });

    if (!guide) {
      res.status(404).json({ success: false, message: "Guide not found" });
      return;
    }

    res.json({
      success: true,
      data: guide,
    });
  } catch (error) {
    next(error);
  }
};

export const createGuide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const guide = await Guide.create(req.body);
    res.status(201).json({
      success: true,
      message: "Guide created successfully",
      data: guide,
    });
  } catch (error) {
    next(error);
  }
};
