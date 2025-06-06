import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

import { query } from "../db.js"; // dùng async query wrapper

const router = express.Router();

// cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// lưu file lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "products", resource_type: "auto" },
});
const upload = multer({ storage });

/**
 * [GET] /media/product/:id - Lấy danh sách media của sản phẩm
 */
router.get("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await query(
      "SELECT id, type, url, is_main, uploaded_at FROM product_media WHERE product_id = ? ORDER BY uploaded_at DESC",
      [id],
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy media:", err);
    res.status(500).json({ error: "Không lấy được media" });
  }
});

/**
 * [POST] /media/upload - Upload media mới
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  const { product_id } = req.body;
  const file = req.file;

  if (!file || !product_id) {
    return res.status(400).json({ error: "Thiếu file hoặc product_id" });
  }

  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const url = file.path;
  const public_id = file.filename;

  try {
    const countResult = await query(
      "SELECT COUNT(*) AS count FROM product_media WHERE product_id = ?",
      [product_id],
    );
    const is_main = countResult[0].count === 0;

    await query(
      "INSERT INTO product_media (product_id, type, url, public_id, is_main) VALUES (?, ?, ?, ?, ?)",
      [product_id, type, url, public_id, is_main],
    );

    res.json({ message: "Upload thành công", url });
  } catch (err) {
    console.error("❌ Lỗi khi upload:", err);
    res.status(500).json({ error: "Lỗi upload hoặc lưu DB" });
  }
});

/**
 * [DELETE] /media/:id - Xoá media
 */
router.delete("/:id", async (req, res) => {
  const mediaId = req.params.id;

  try {
    const result = await query(
      "SELECT public_id FROM product_media WHERE id = ?",
      [mediaId],
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const publicId = result[0].public_id;

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
      } catch (e) {
        console.error("❌ Lỗi xoá Cloudinary:", e);
      }
    }

    await query("DELETE FROM product_media WHERE id = ?", [mediaId]);
    res.json({ message: "Đã xoá thành công" });
  } catch (err) {
    console.error("❌ Lỗi khi xoá media:", err);
    res.status(500).json({ error: "Lỗi xoá media" });
  }
});

/**
 * [PATCH] /media/:id/set-main - Đặt ảnh chính
 */
router.patch("/:id/set-main", async (req, res) => {
  const mediaId = req.params.id;

  try {
    const results = await query(
      "SELECT product_id FROM product_media WHERE id = ?",
      [mediaId],
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const productId = results[0].product_id;

    await query(
      "UPDATE product_media SET is_main = false WHERE product_id = ?",
      [productId],
    );
    await query("UPDATE product_media SET is_main = true WHERE id = ?", [
      mediaId,
    ]);

    res.json({ message: "Đã đặt ảnh chính" });
  } catch (err) {
    console.error("❌ Lỗi đặt ảnh chính:", err);
    res.status(500).json({ error: "Không thể đặt ảnh chính" });
  }
});

export default router;
