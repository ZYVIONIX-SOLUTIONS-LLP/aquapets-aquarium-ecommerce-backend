import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Types } from "mongoose";

// Helper to convert string product identifier (ObjectId or slug or id) into ObjectId
const resolveProductObjectId = async (productIdentifier: string): Promise<Types.ObjectId | null> => {
  if (!productIdentifier) return null;
  if (Types.ObjectId.isValid(productIdentifier)) {
    return new Types.ObjectId(productIdentifier);
  }
  const product = await Product.findOne({
    $or: [{ _id: productIdentifier }, { slug: productIdentifier }, { id: productIdentifier }],
  }).select("_id");

  return product ? (product._id as Types.ObjectId) : null;
};

/**
 * @desc Get user's wishlist from MongoDB
 * @route GET /api/wishlist
 * @access Private
 */
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("wishlist");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      wishlist: user.wishlist || [],
      wishlistIds: (user.wishlist || []).map((item: any) => item._id?.toString() || item.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch wishlist" });
  }
};

/**
 * @desc Toggle product in user's wishlist
 * @route POST /api/wishlist/toggle
 * @access Private
 */
export const toggleWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, message: "productId is required" });
      return;
    }

    const productObjId = await resolveProductObjectId(String(productId));
    if (!productObjId) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const existsIndex = user.wishlist.findIndex((id) => id.toString() === productObjId.toString());

    if (existsIndex > -1) {
      user.wishlist.splice(existsIndex, 1);
    } else {
      user.wishlist.push(productObjId);
    }

    await user.save();

    const updatedUser = await User.findById(userId).populate("wishlist");

    res.json({
      success: true,
      message: existsIndex > -1 ? "Removed from wishlist" : "Added to wishlist",
      wishlist: updatedUser?.wishlist || [],
      wishlistIds: (updatedUser?.wishlist || []).map((item: any) => item._id?.toString() || item.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to toggle wishlist" });
  }
};

/**
 * @desc Sync local storage wishlist with database upon login
 * @route POST /api/wishlist/sync
 * @access Private
 */
export const syncWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { wishlistIds } = req.body;

    if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
      const user = await User.findById(userId).populate("wishlist");
      res.json({
        success: true,
        wishlist: user?.wishlist || [],
        wishlistIds: (user?.wishlist || []).map((item: any) => item._id?.toString() || item.toString()),
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const currentIdsSet = new Set(user.wishlist.map((id) => id.toString()));

    for (const rawId of wishlistIds) {
      if (!rawId) continue;
      const productObjId = await resolveProductObjectId(String(rawId));
      if (productObjId && !currentIdsSet.has(productObjId.toString())) {
        currentIdsSet.add(productObjId.toString());
        user.wishlist.push(productObjId);
      }
    }

    await user.save();

    const updatedUser = await User.findById(userId).populate("wishlist");

    res.json({
      success: true,
      message: "Wishlist synced with database",
      wishlist: updatedUser?.wishlist || [],
      wishlistIds: (updatedUser?.wishlist || []).map((item: any) => item._id?.toString() || item.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to sync wishlist" });
  }
};
