import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ⚙️ Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📁 Cấu hình lưu trữ vào Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

/**
 * POST /api/upload
 * Upload 1 file (ảnh hoặc video) cho sản phẩm
 */
router.post("/upload", upload.single("file"), (req, res) => {
  const { product_id } = req.body;
  const file = req.file;

  if (!file || !product_id) {
    return res.status(400).json({ error: "Thiếu file hoặc product_id" });
  }

  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const url = file.path;
  const public_id = file.filename;

  // Kiểm tra số lượng media hiện có của sản phẩm
  db.query(
    "SELECT COUNT(*) AS count FROM product_media WHERE product_id = ?",
    [product_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi kiểm tra DB" });
      }

      const is_main = result[0].count === 0;

      db.query(
        "INSERT INTO product_media (product_id, type, url, public_id, is_main) VALUES (?, ?, ?, ?, ?)",
        [product_id, type, url, public_id, is_main],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "Lỗi lưu DB" });
          }

          res.json({ message: "Upload thành công", url });
        },
      );
    },
  );
});

/**
 * DELETE /api/upload/:id
 */
router.delete("/upload/:id", (req, res) => {
  const mediaId = req.params.id;

  db.query(
    "SELECT public_id FROM product_media WHERE id = ?",
    [mediaId],
    (err, results) => {
      if (err || results.length === 0) {
        console.error(err);
        return res.status(404).json({ error: "Không tìm thấy media" });
      }

      const publicId = results[0].public_id;

      cloudinary.uploader.destroy(
        publicId,
        { resource_type: "auto" },
        (error) => {
          if (error) console.error("Lỗi xoá Cloudinary:", error);

          db.query(
            "DELETE FROM product_media WHERE id = ?",
            [mediaId],
            (err2) => {
              if (err2) {
                console.error(err2);
                return res.status(500).json({ error: "Lỗi xóa DB" });
              }

              res.json({ message: "Đã xoá thành công" });
            },
          );
        },
      );
    },
  );
});

/**
 * GET /api/products/:id/media
 */
router.get("/products/:id/media", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM product_media WHERE product_id = ? ORDER BY uploaded_at DESC",
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi truy vấn media" });
      }
      res.json(results);
    },
  );
});

/**
 * PATCH /api/upload/:id/set-main
 */
router.patch("/:id/set-main", (req, res) => {
  const mediaId = req.params.id;

  db.query(
    "SELECT product_id FROM product_media WHERE id = ?",
    [mediaId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy media" });
      }

      const productId = results[0].product_id;

      db.query(
        "UPDATE product_media SET is_main = false WHERE product_id = ?",
        [productId],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "Lỗi cập nhật media" });
          }

          db.query(
            "UPDATE product_media SET is_main = true WHERE id = ?",
            [mediaId],
            (err3) => {
              if (err3) {
                console.error(err3);
                return res.status(500).json({ error: "Lỗi đặt ảnh chính" });
              }

              res.json({ message: "✅ Đã đặt ảnh chính" });
            },
          );
        },
      );
    },
  );
});

export default router;
