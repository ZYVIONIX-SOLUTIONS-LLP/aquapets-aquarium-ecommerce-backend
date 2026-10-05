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
    const product = await Product.findOne({ slug }).lean();

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

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (data.badge === "" || data.badge === null) delete data.badge;
    if (data.offerType === "" || data.offerType === null) delete data.offerType;
    if (data.tankType === "" || data.tankType === null) delete data.tankType;
    if (Array.isArray(data.images)) {
      data.images = data.images.slice(0, 4);
    }

    const product = await Product.create(data);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

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
    if (Array.isArray(data.images)) {
      data.images = data.images.slice(0, 4);
    }

    const updateDoc: any = { $set: data };
    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields;
    }

    let product;
    const idStr = String(id);
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndUpdate(idStr, updateDoc, { new: true, runValidators: true });
    } else {
      product = await Product.findOneAndUpdate({ slug: idStr }, updateDoc, { new: true, runValidators: true });
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
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Clean up associated Cloudinary images
    if (product.images && Array.isArray(product.images)) {
      for (const imgUrl of product.images) {
        if (typeof imgUrl === "string" && imgUrl.includes("res.cloudinary.com")) {
          const publicId = parseCloudinaryPublicId(imgUrl);
          if (publicId) {
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (cErr) {
              console.warn(`Could not delete Cloudinary image ${publicId}:`, cErr);
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Product and associated images deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
