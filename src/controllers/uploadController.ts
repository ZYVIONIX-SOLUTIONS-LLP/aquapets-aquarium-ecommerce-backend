import { Request, Response, NextFunction } from "express";
import { cloudinary } from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Robustly extract and decode Cloudinary public_id from a URL or raw public_id
 */
export const parseCloudinaryPublicId = (urlOrPublicId: string): string | null => {
  if (!urlOrPublicId) return null;

  try {
    let str = decodeURIComponent(urlOrPublicId.trim());
    // Strip query params or hash
    str = str.split("?")[0].split("#")[0];

    // If it's a URL or contains /upload/
    if (str.includes("/upload/")) {
      const afterUpload = str.substring(str.indexOf("/upload/") + 8);
      const parts = afterUpload.split("/");
      
      // Look for the version segment like 'v1790605051'
      const versionIndex = parts.findIndex((p) => /^v\d+$/.test(p));
      let publicIdWithExt: string;

      if (versionIndex !== -1) {
        // Everything after version is guaranteed to be folder/public_id.ext
        publicIdWithExt = parts.slice(versionIndex + 1).join("/");
      } else {
        // If folder is aqua-pets, start from aqua-pets
        const aquaIndex = parts.findIndex((p) => p === "aqua-pets");
        if (aquaIndex !== -1) {
          publicIdWithExt = parts.slice(aquaIndex).join("/");
        } else {
          // Filter out transformation segments (e.g. f_auto, q_auto, w_500, etc.)
          const isTransformation = (p: string) => /^(?:[a-z]{1,4}_|f_auto|q_auto)/i.test(p);
          let startIdx = 0;
          while (startIdx < parts.length - 1 && isTransformation(parts[startIdx])) {
            startIdx++;
          }
          publicIdWithExt = parts.slice(startIdx).join("/");
        }
      }

      // Remove only the final file extension
      return publicIdWithExt.replace(/\.[a-zA-Z0-9]{3,4}$/, "");
    }

    // If it's a raw string or partial path (e.g. 'v12345/aqua-pets/products/item' or 'aqua-pets/products/item')
    str = str.replace(/^v\d+\//, "");
    return str.replace(/\.[a-zA-Z0-9]{3,4}$/, "");
  } catch (err) {
    console.warn("Error parsing Cloudinary URL:", err);
  }

  return null;
};

/**
 * Helper to upload buffer stream to Cloudinary with sanitized public_id
 */
const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = "aqua-pets/products",
  filename?: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Generate clean slug for filename without unsafe characters
    const cleanPublicId = filename
      ? `${Date.now()}-${filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40)}`
      : undefined;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: cleanPublicId,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * 1. POST /api/upload
 * Handles single image file upload or base64 data URL
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const folder = (req.body.folder as string) || "aqua-pets/products";
    const dataUrl = req.body.dataUrl || req.body.image || req.body.url;

    // Case 1: Upload via Multer File
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, folder, req.file.originalname);
      res.status(201).json({
        success: true,
        message: "Image uploaded successfully to Cloudinary",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      });
      return;
    }

    // Case 2: Upload via Base64 Data URL or Web URL
    if (dataUrl && typeof dataUrl === "string") {
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder,
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully to Cloudinary",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "No image file or dataUrl provided in request",
    });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Cloudinary upload failed",
    });
  }
};

/**
 * 2. POST /api/upload/multiple
 * Handles multiple image files upload (up to 10 images)
 */
export const uploadMultipleImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const folder = (req.body.folder as string) || "aqua-pets/products";
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No image files provided",
      });
      return;
    }

    const uploadPromises = files.map((file) =>
      uploadBufferToCloudinary(file.buffer, folder, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      message: `${results.length} image(s) uploaded successfully to Cloudinary`,
      data: results.map((r) => ({
        url: r.secure_url,
        publicId: r.public_id,
        width: r.width,
        height: r.height,
        format: r.format,
      })),
    });
  } catch (error: any) {
    console.error("Cloudinary Multiple Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Cloudinary multiple upload failed",
    });
  }
};

/**
 * 3. DELETE /api/upload
 * Deletes an image from Cloudinary by publicId or full URL
 */
export const deleteImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input =
      (req.body.publicId as string) ||
      (req.body.url as string) ||
      (req.body.imageUrl as string) ||
      (req.query.publicId as string) ||
      (req.query.url as string);

    if (!input) {
      res.status(400).json({
        success: false,
        message: "publicId or url is required to delete an image from Cloudinary",
      });
      return;
    }

    const publicId = parseCloudinaryPublicId(input);

    if (!publicId) {
      res.status(400).json({
        success: false,
        message: "Could not parse a valid Cloudinary public_id from the provided input",
      });
      return;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: "Image deleted from Cloudinary",
      data: result,
      publicId,
    });
  } catch (error: any) {
    console.error("Cloudinary Delete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Cloudinary image deletion failed",
    });
  }
};
