import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User, ICartItem } from "../models/User.js";
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

// Format populated cart items for clean JSON client consumption
const formatPopulatedCart = (cart: any[]): any[] => {
  if (!Array.isArray(cart)) return [];
  const formatted: any[] = [];
  for (const item of cart) {
    if (item && item.product) {
      formatted.push({
        product: item.product,
        quantity: Math.max(1, Number(item.quantity) || 1),
        selectedVariant: item.selectedVariant || "",
      });
    }
  }
  return formatted;
};

/**
 * @desc Get user's cart from MongoDB
 * @route GET /api/cart
 * @access Private
 */
export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("cart.product");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const items = formatPopulatedCart(user.cart || []);
    res.json({
      success: true,
      cart: items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch cart" });
  }
};

/**
 * @desc Sync local/guest cart with user's persistent cart upon login
 * @route POST /api/cart/sync
 * @access Private
 */
export const syncCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { items: incomingItems } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!user.cart) {
      user.cart = [];
    }

    if (Array.isArray(incomingItems) && incomingItems.length > 0) {
      for (const item of incomingItems) {
        const prodId = item.productId || item.product?.id || item.product?._id || item.product?.slug;
        const resolvedId = await resolveProductObjectId(String(prodId));
        if (!resolvedId) continue;

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const selectedVariant = String(item.selectedVariant || "").trim();

        const existingIdx = user.cart.findIndex(
          (c) => c.product.toString() === resolvedId.toString() && (c.selectedVariant || "") === selectedVariant
        );

        if (existingIdx > -1) {
          user.cart[existingIdx].quantity = Math.max(user.cart[existingIdx].quantity, quantity);
        } else {
          user.cart.push({
            product: resolvedId,
            quantity,
            selectedVariant,
          });
        }
      }
      await user.save();
    }

    const updatedUser = await User.findById(userId).populate("cart.product");
    const formatted = formatPopulatedCart(updatedUser?.cart || []);

    res.json({
      success: true,
      message: "Cart synchronized successfully",
      cart: formatted,
      totalItems: formatted.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to sync cart" });
  }
};

/**
 * @desc Replace / update entire cart for logged in user
 * @route PUT /api/cart
 * @access Private
 */
export const updateCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { items: incomingItems } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const newCart: ICartItem[] = [];
    if (Array.isArray(incomingItems)) {
      for (const item of incomingItems) {
        const prodId = item.productId || item.product?.id || item.product?._id || item.product?.slug;
        const resolvedId = await resolveProductObjectId(String(prodId));
        if (!resolvedId) continue;

        const quantity = Math.max(1, Number(item.quantity) || 1);
        const selectedVariant = String(item.selectedVariant || "").trim();

        newCart.push({
          product: resolvedId,
          quantity,
          selectedVariant,
        });
      }
    }

    user.cart = newCart;
    await user.save();

    const updatedUser = await User.findById(userId).populate("cart.product");
    const formatted = formatPopulatedCart(updatedUser?.cart || []);

    res.json({
      success: true,
      cart: formatted,
      totalItems: formatted.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update cart" });
  }
};

/**
 * @desc Clear entire cart for logged in user
 * @route DELETE /api/cart
 * @access Private
 */
export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cart: [],
      totalItems: 0,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to clear cart" });
  }
};
