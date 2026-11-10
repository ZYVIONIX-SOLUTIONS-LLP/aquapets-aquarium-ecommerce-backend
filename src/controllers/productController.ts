import { Request, Response, NextFunction } from "express";
import { Product } from "../models/Product.js";
import { cloudinary } from "../config/cloudinary.js";
import { parseCloudinaryPublicId } from "./uploadController.js";

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      tankType,
      isFeatured,
      isStarterKit,
      isOffer,
      search,
      badge,
      minPrice,
      maxPrice,
      sort,
      page = "1",
      limit = "1000",
    } = req.query;

    const query: Record<string, any> = {};

    if (category && category !== "all") query.category = category;
    if (tankType) query.tankType = tankType;
    if (isFeatured === "true") query.isFeatured = true;
    if (isStarterKit === "true") query.isStarterKit = true;
    if (isOffer === "true") {
      query.isOffer = true;
    }
    if (badge) query.badge = badge;

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    } else if (req.query.includeInactive !== "true") {
      query.isActive = { $ne: false };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      const searchStr = (search as string).trim();
      const searchOr = [
        { name: { $regex: searchStr, $options: "i" } },
        { brand: { $regex: searchStr, $options: "i" } },
        { category: { $regex: searchStr, $options: "i" } },
        { description: { $regex: searchStr, $options: "i" } },
        { tankType: { $regex: searchStr, $options: "i" } },
        { badge: { $regex: searchStr, $options: "i" } },
        { tags: { $in: [new RegExp(searchStr, "i")] } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { price: 1 };
    if (sort === "price-desc") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "popular") sortOption = { reviewCount: -1 };

    const pageNum = parseInt(page as string, 10);
    const limitNum = limit === "all" || limit === "0" ? 1000 : parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const query: Record<string, any> = { slug };
    if (req.query.includeInactive !== "true") {
      query.isActive = { $ne: false };
    }
    const product = await Product.findOne(query).lean();

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Automatically uploads any base64 data URL images in the list to Cloudinary
 */
const ensureCloudinaryImages = async (images: string[]): Promise<string[]> => {
  if (!Array.isArray(images) || images.length === 0) return [];
  const processed: string[] = [];

  for (const img of images.slice(0, 4)) {
    if (typeof img === "string" && img.startsWith("data:image/")) {
      try {
        const uploadRes = await cloudinary.uploader.upload(img, {
          folder: "aqua-pets/products",
          resource_type: "auto",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        });
        processed.push(uploadRes.secure_url);
      } catch (err) {
        console.error("Failed to upload base64 image to Cloudinary during product save:", err);
        processed.push(img);
      }
    } else if (typeof img === "string" && img.trim()) {
      processed.push(img);
    }
  }

  return processed;
};

const normalizeBrand = (brand?: string): string => {
  if (!brand) return "Aqua Pets";
  const b = brand.trim();
  if (/^sunsun$/i.test(b)) return "SunSun";
  if (/^bluepet$/i.test(b)) return "Bluepet";
  if (/^hailea$/i.test(b)) return "Hailea";
  if (/^rs\s*electrical$/i.test(b)) return "RS Electrical";
  if (/^aquapets/i.test(b)) return "AquaPets Aquarium";
  return b;
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.brand) {
      data.brand = normalizeBrand(data.brand);
    } else {
      data.brand = "Aqua Pets";
    }
    if (data.badge === "" || data.badge === null) delete data.badge;
    if (data.offerType === "" || data.offerType === null) delete data.offerType;
    if (data.tankType === "" || data.tankType === null) delete data.tankType;

    if (data.isActive !== undefined) {
      data.isActive = Boolean(data.isActive);
    } else {
      data.isActive = true;
    }

    if (!data.category || typeof data.category !== "string" || !data.category.trim()) {
      data.category = "aquariums-tanks";
    }

    if (!data.description || typeof data.description !== "string" || !data.description.trim()) {
      data.description = `${data.name || "Product"} - Quality aquarium supply from Aqua Pets Aquarium.`;
    }

    let baseSlug = (data.slug || (data.name ? data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : `product`))
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = `product-${Date.now()}`;

    let finalSlug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    data.slug = finalSlug;

    if (Array.isArray(data.images)) {
      data.images = await ensureCloudinaryImages(data.images);
    }

    const product = await Product.create(data);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message).join(", ");
      res.status(400).json({
        success: false,
        message: messages || "Validation error creating product",
      });
      return;
    }
    if (error?.code === 11000) {
      res.status(409).json({
        success: false,
        message: "A product with this title or slug already exists.",
      });
      return;
    }
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.brand) {
      data.brand = normalizeBrand(data.brand);
    }

    const unsetFields: Record<string, 1> = {};
    if (data.badge === "" || data.badge === null) {
      delete data.badge;
      unsetFields.badge = 1;
    }
    if (data.offerType === "" || data.offerType === null) {
      delete data.offerType;
      unsetFields.offerType = 1;
    }
    if (data.tankType === "" || data.tankType === null) {
      delete data.tankType;
      unsetFields.tankType = 1;
    }
    if (data.isActive !== undefined) {
      data.isActive = Boolean(data.isActive);
    }
    if (Array.isArray(data.images)) {
      data.images = await ensureCloudinaryImages(data.images);
    }

    const updateDoc: any = { $set: data };
    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields;
    }

    let product;
    const idStr = String(id);
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndUpdate(idStr, updateDoc, { returnDocument: "after", runValidators: true });
    } else {
      product = await Product.findOneAndUpdate({ slug: idStr }, updateDoc, { returnDocument: "after", runValidators: true });
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = decodeURIComponent(String(id).trim());
    let product = null;

    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idStr);
    }
    if (!product) {
      product = await Product.findOne({ slug: idStr });
    }
    if (!product) {
      product = await Product.findOne({ slug: idStr.toLowerCase() });
    }

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Clean up associated Cloudinary images
    if (product.images && Array.isArray(product.images)) {
      for (const imgUrl of product.images) {
        if (typeof imgUrl === "string" && (imgUrl.includes("cloudinary.com") || imgUrl.startsWith("aqua-pets/"))) {
          const publicId = imgUrl.startsWith("aqua-pets/")
            ? imgUrl.replace(/\.[a-zA-Z0-9]{3,4}$/, "")
            : parseCloudinaryPublicId(imgUrl);
          if (publicId) {
            try {
              const destroyRes = await cloudinary.uploader.destroy(publicId, { invalidate: true });
              console.log(`Cloudinary destroyed asset [${publicId}] result:`, destroyRes);
            } catch (cErr) {
              console.warn(`Could not delete Cloudinary image ${publicId}:`, cErr);
            }
          }
        }
      }
    }

    await Product.findByIdAndDelete(product._id);

    res.json({
      success: true,
      message: "Product and associated images deleted successfully",
      deletedId: product._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply bulk discount/offer across all products or a specific category
 */
export const applyBulkOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, discount, badge, offerType } = req.body;

    const discountNum = Math.round(Number(discount));
    if (isNaN(discountNum) || discountNum <= 0 || discountNum >= 100) {
      res.status(400).json({ success: false, message: "Discount percentage must be between 1 and 99." });
      return;
    }

    const query: Record<string, any> = {};
    if (category && category !== "all") {
      query.$or = [
        { category: category },
        { category: { $regex: new RegExp(`^${category}$`, "i") } },
      ];
    }

    const products = await Product.find(query);
    if (!products || products.length === 0) {
      res.status(404).json({ success: false, message: "No products found matching the selected category." });
      return;
    }

    const bulkOps: any[] = products.map((product) => {
      // Base regular price: use existing originalPrice if valid, else current price
      const basePrice = product.originalPrice && product.originalPrice > 0
        ? product.originalPrice
        : product.price;

      const newPrice = Math.max(1, Math.round(basePrice * (1 - discountNum / 100)));

      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              originalPrice: basePrice,
              price: newPrice,
              discount: discountNum,
              isOffer: true,
              offerType: offerType || "Discount",
              badge: badge && String(badge).trim() ? String(badge).trim() : "Sale",
            },
          },
        },
      };
    });

    const result = await Product.bulkWrite(bulkOps as any);

    res.json({
      success: true,
      message: `Successfully applied ${discountNum}% offer to ${result.modifiedCount} product(s).`,
      affectedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset / restore regular prices for products with active offers
 */
export const resetBulkOffers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.body;

    const query: Record<string, any> = {
      $or: [{ isOffer: true }, { originalPrice: { $gt: 0 } }],
    };

    if (category && category !== "all") {
      query.$and = [
        {
          $or: [
            { category: category },
            { category: { $regex: new RegExp(`^${category}$`, "i") } },
          ],
        },
      ];
    }

    const products = await Product.find(query);
    if (!products || products.length === 0) {
      res.json({
        success: true,
        message: "No products currently have active offers to reset in the selected category.",
        affectedCount: 0,
      });
      return;
    }

    const bulkOps: any[] = products.map((product) => {
      const restoredPrice = product.originalPrice && product.originalPrice > 0
        ? product.originalPrice
        : product.price;

      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              price: restoredPrice,
              discount: 0,
              isOffer: false,
              badge: "",
            },
            $unset: {
              offerType: "",
            },
          },
        },
      };
    });

    const result = await Product.bulkWrite(bulkOps as any);

    res.json({
      success: true,
      message: `Successfully restored regular prices for ${result.modifiedCount} product(s).`,
      affectedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get summary of active promotional offers
 */
export const getOffersSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [offerProducts, totalProducts] = await Promise.all([
      Product.find({ isOffer: true }).sort({ updatedAt: -1 }).lean(),
      Product.countDocuments(),
    ]);

    res.json({
      success: true,
      totalProducts,
      offerCount: offerProducts.length,
      products: offerProducts,
    });
  } catch (error) {
    next(error);
  }
};
