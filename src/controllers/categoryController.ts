import { Request, Response, NextFunction } from "express";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";

const getRealCategoryCounts = async (): Promise<Map<string, number>> => {
  const counts = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map<string, number>();
  counts.forEach((c) => {
    if (c._id) {
      countMap.set(String(c._id).toLowerCase(), c.count);
    }
  });
  return countMap;
};

export const DEFAULT_CATEGORIES = [
  {
    slug: "aquariums-tanks",
    name: "Aquariums & Tanks",
    description: "Ultra-clear rimless glass tanks, cabinet aquariums, and desktop setups.",
    image: "/categories/aquariums-tanks.jpg",
    productCount: 0,
    iconName: "Box",
    sortOrder: 1,
  },
  {
    slug: "fish-food",
    name: "Fish Food",
    description: "Premium nutrition flakes, micro-pellets, freeze-dried treats, and algae wafers.",
    image: "/categories/fish-food.jpg",
    productCount: 0,
    iconName: "Utensils",
    sortOrder: 2,
  },
  {
    slug: "aquarium-filters",
    name: "Aquarium Filters",
    description: "Canister, submersible internal, hang-on back (HOB), and trickle filters.",
    image: "/categories/aquarium-filters.jpg",
    productCount: 0,
    iconName: "Filter",
    sortOrder: 3,
  },
  {
    slug: "filter-media",
    name: "Filter Media",
    description: "Ceramic bio rings, activated carbon, coarse sponges, and chemical media.",
    image: "/categories/filter-media.jpg",
    productCount: 0,
    iconName: "Layers",
    sortOrder: 4,
  },
  {
    slug: "air-pumps-accessories",
    name: "Air Pumps & Accessories",
    description: "Silent air pumps, airline tubing, air stones, check valves, and manifolds.",
    image: "/categories/air-pumps-accessories.jpg",
    productCount: 0,
    iconName: "Wind",
    sortOrder: 5,
  },
  {
    slug: "water-pumps-circulation",
    name: "Water Pumps & Circulation",
    description: "High-flow submersible return pumps, wavemakers, and flow generators.",
    image: "/categories/water-pumps-circulation.jpg",
    productCount: 0,
    iconName: "Gauge",
    sortOrder: 6,
  },
  {
    slug: "aquarium-lights",
    name: "Aquarium Lights",
    description: "Full-spectrum WRGB, high-PAR plant growth LEDs, clip lights, and lightbars.",
    image: "/categories/aquarium-lights.jpg",
    productCount: 0,
    iconName: "Sun",
    sortOrder: 7,
  },
  {
    slug: "heaters-temperature",
    name: "Heaters & Temperature",
    description: "Titanium & quartz digital heaters, external controllers, and thermometers.",
    image: "/categories/heaters-temperature.jpg",
    productCount: 0,
    iconName: "Thermometer",
    sortOrder: 8,
  },
  {
    slug: "water-care",
    name: "Water Care",
    description: "Dechlorinators, nitrifying bacteria, plant fertilizers, and pH buffers.",
    image: "/categories/water-care.jpg",
    productCount: 0,
    iconName: "Droplet",
    sortOrder: 9,
  },
  {
    slug: "fish-medicines",
    name: "Fish Medicines",
    description: "Broad-spectrum antibacterial, antifungal, anti-parasite, and aquarium salt.",
    image: "/categories/fish-medicines.jpg",
    productCount: 0,
    iconName: "Shield",
    sortOrder: 10,
  },
  {
    slug: "aquarium-plants",
    name: "Aquarium Plants",
    description: "Tissue-cultured foreground carpets, stem plants, anubias, and mosses.",
    image: "/categories/aquarium-plants.jpg",
    productCount: 0,
    iconName: "Leaf",
    sortOrder: 11,
  },
  {
    slug: "artificial-plants",
    name: "Artificial Plants",
    description: "Silk and high-grade safe plastic plants for low-maintenance vibrant tanks.",
    image: "/categories/artificial-plants.jpg",
    productCount: 0,
    iconName: "Leaf",
    sortOrder: 12,
  },
  {
    slug: "gravel-sand",
    name: "Gravel & Sand",
    description: "Aquasoil, natural river sand, cosmetic silica, and nutrient-rich substrates.",
    image: "/categories/gravel-sand.jpg",
    productCount: 0,
    iconName: "Layers",
    sortOrder: 13,
  },
  {
    slug: "driftwood-rocks",
    name: "Driftwood & Rocks",
    description: "Seiryu stone, dragon stone, spiderwood, Malaysian driftwood, and slate.",
    image: "/categories/driftwood-rocks.jpg",
    productCount: 0,
    iconName: "Mountain",
    sortOrder: 14,
  },
  {
    slug: "aquarium-decorations",
    name: "Aquarium Decorations",
    description: "Natural cave hideouts, ceramic breeding cones, resin ruins, and sunken ships.",
    image: "/categories/aquarium-decorations.jpg",
    productCount: 0,
    iconName: "Compass",
    sortOrder: 15,
  },
  {
    slug: "aquascaping-tools",
    name: "Aquascaping Tools",
    description: "Stainless steel curved tweezers, wave scissors, sand flatteners, and tool holders.",
    image: "/categories/aquascaping-tools.jpg",
    productCount: 0,
    iconName: "Scissors",
    sortOrder: 16,
  },
  {
    slug: "co2-planted-tank",
    name: "CO2 & Planted Tank",
    description: "Pressurized CO2 cylinders, dual-stage regulators, diffusers, and drop checkers.",
    image: "/categories/co2-planted-tank.jpg",
    productCount: 0,
    iconName: "Zap",
    sortOrder: 17,
  },
  {
    slug: "cleaning-maintenance",
    name: "Cleaning & Maintenance",
    description: "Magnetic glass cleaners, gravel siphons, algae scrapers, and brush sets.",
    image: "/categories/cleaning-maintenance.jpg",
    productCount: 0,
    iconName: "Wrench",
    sortOrder: 18,
  },
  {
    slug: "feeding-breeding-accessories",
    name: "Feeding & Breeding Accessories",
    description: "Automatic fish feeders, breeding traps, worm feeders, and fry mesh boxes.",
    image: "/categories/feeding-breeding-accessories.jpg",
    productCount: 0,
    iconName: "Heart",
    sortOrder: 19,
  },
  {
    slug: "spare-accessories",
    name: "Spare Accessories",
    description: "Suction cups, replacement impellers, hose adapters, pipe clips, and seals.",
    image: "/categories/spare-accessories.jpg",
    productCount: 0,
    iconName: "Sliders",
    sortOrder: 20,
  },
];

let cachedCategories: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

export const invalidateCategoryCache = () => {
  cachedCategories = null;
  lastCacheTime = 0;
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = Date.now();
    const forceRefresh = req.query.refresh === "true" || req.headers["cache-control"] === "no-cache";
    if (!forceRefresh && cachedCategories && now - lastCacheTime < CACHE_TTL_MS) {
      res.json({
        success: true,
        data: cachedCategories,
      });
      return;
    }

    let categories = await Category.find({ slug: { $nin: ["air-pumps", "electrical-spare-accessories"] } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    // Auto-seed if database has no categories or fewer than 20
    if (categories.length < DEFAULT_CATEGORIES.length) {
      for (const cat of DEFAULT_CATEGORIES) {
        await Category.findOneAndUpdate(
          { slug: cat.slug },
          { $set: cat },
          { upsert: true, new: true }
        );
      }
      categories = await Category.find({ slug: { $nin: ["air-pumps", "electrical-spare-accessories"] } })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();
    }

    const countMap = await getRealCategoryCounts();

    const categoriesWithRealCounts = categories.map((cat: any) => {
      const realCount = countMap.get(cat.slug.toLowerCase()) || 0;
      return {
        ...cat,
        productCount: realCount,
      };
    });

    cachedCategories = categoriesWithRealCounts;
    lastCacheTime = now;

    res.json({
      success: true,
      data: categoriesWithRealCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    let category = await Category.findOne({ slug });

    if (!category) {
      // Check in default list as fallback
      const def = DEFAULT_CATEGORIES.find((c) => c.slug === slug);
      if (def) {
        category = await Category.create(def);
      } else {
        res.status(404).json({ success: false, message: "Category not found" });
        return;
      }
    }

    const realCount = await Product.countDocuments({ category: slug });
    const categoryObj = category.toObject();
    categoryObj.productCount = realCount;

    res.json({
      success: true,
      data: categoryObj,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    if (!data.name || !data.name.trim()) {
      res.status(400).json({ success: false, message: "Category name is required" });
      return;
    }
    if (!data.slug || !data.slug.trim()) {
      data.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    } else {
      data.slug = data.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (!data.image || !data.image.trim()) {
      data.image = "/categories/aquariums-tanks.jpg";
    }

    const existing = await Category.findOne({ slug: data.slug });
    if (existing) {
      data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
    }

    const category = await Category.create(data);
    invalidateCategoryCache();
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, message: "A category with this name or slug already exists." });
      return;
    }
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = String(id);
    let category;
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findByIdAndUpdate(idStr, req.body, { new: true, runValidators: true });
    } else {
      category = await Category.findOneAndUpdate({ slug: idStr }, req.body, { new: true, runValidators: true });
    }
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
    invalidateCategoryCache();
    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = String(id);
    let category;
    if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findByIdAndDelete(idStr);
    } else {
      category = await Category.findOneAndDelete({ slug: idStr });
    }
    if (!category) {
      res.status(404).json({ success: false, message: "Category not found" });
      return;
    }
    invalidateCategoryCache();
    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const syncAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true }
      );
    }
    invalidateCategoryCache();
    const categories = await Category.find().sort({ createdAt: 1 });
    const countMap = await getRealCategoryCounts();

    const categoriesWithRealCounts = categories.map((cat) => {
      const catObj = cat.toObject();
      const realCount = countMap.get(cat.slug.toLowerCase()) || 0;
      return {
        ...catObj,
        productCount: realCount,
      };
    });

    res.json({
      success: true,
      message: "All 20 categories synced in database successfully",
      count: categoriesWithRealCounts.length,
      data: categoriesWithRealCounts,
    });
  } catch (error) {
    next(error);
  }
};
