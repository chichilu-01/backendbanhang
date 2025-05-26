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
    folder: "products", // thư mục trên Cloudinary
    resource_type: "auto", // cho phép ảnh và video
  },
});

const upload = multer({ storage });

/**
 * POST /api/upload
 * Upload 1 file (ảnh hoặc video) cho sản phẩm
 */
router.post("/", upload.single("file"), (req, res) => {
  const { product_id } = req.body;
  const file = req.file;

  if (!file || !product_id) {
    return res.status(400).json({ error: "Thiếu file hoặc product_id" });
  }

  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const url = file.path; // Cloudinary URL
  const public_id = file.filename; // để dùng khi xoá

  db.query(
    "INSERT INTO product_media (product_id, type, url, public_id) VALUES (?, ?, ?, ?)",
    [product_id, type, url, public_id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi lưu DB" });
      }

      res.json({ message: "Upload thành công", url });
    },
  );
});

/**
 * DELETE /api/upload/:id
 * Xoá media khỏi Cloudinary + DB
 */
router.delete("/:id", (req, res) => {
  const mediaId = req.params.id;

  db.query(
    "SELECT public_id FROM product_media WHERE id = ?",
    [mediaId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi truy vấn DB" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy media" });
      }

      const publicId = results[0].public_id;

      // Xoá ảnh/video khỏi Cloudinary
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: "auto" },
        (error) => {
          if (error) {
            console.error("Lỗi xoá Cloudinary:", error);
          }

          // Xoá bản ghi trong DB
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
 * Lấy danh sách ảnh/video theo sản phẩm
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

export default router;
