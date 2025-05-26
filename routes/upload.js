import express from "express";
import multer from "multer";
import path from "path";
import db from "../db.js";
import fs from "fs";

const router = express.Router();

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const isVideo = file.mimetype.startsWith("video/");
    const folder = isVideo ? "uploads/videos" : "uploads/images";
    fs.mkdirSync(folder, { recursive: true }); // tạo thư mục nếu chưa có
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

/**
 * POST /api/upload
 * Upload 1 file (ảnh hoặc video) cho product
 */
router.post("/", upload.single("file"), (req, res) => {
  const { product_id } = req.body;
  const file = req.file;

  if (!file || !product_id) {
    return res.status(400).json({ error: "Thiếu file hoặc product_id" });
  }

  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const url = `/uploads/${type}s/${file.filename}`;

  db.query(
    "INSERT INTO product_media (product_id, type, url) VALUES (?, ?, ?)",
    [product_id, type, url],
    (err, _result) => {
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
 * Xóa media theo ID (file + DB)
 */
router.delete("/:id", (req, res) => {
  const mediaId = req.params.id;

  // 1. Lấy URL file từ DB
  db.query(
    "SELECT url FROM product_media WHERE id = ?",
    [mediaId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Lỗi truy vấn DB" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Media không tồn tại" });
      }

      const fileUrl = results[0].url; // VD: "/uploads/images/abc.jpg"
      const filePath = path.join(process.cwd(), fileUrl);

      // 2. Xóa file khỏi thư mục
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("⚠️ Không thể xóa file, có thể đã bị xoá:", unlinkErr);
          // Tiếp tục xóa trong DB
        }

        // 3. Xóa bản ghi DB
        db.query(
          "DELETE FROM product_media WHERE id = ?",
          [mediaId],
          (err2, _result) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: "Lỗi xóa DB" });
            }

            res.json({ message: "Đã xoá thành công" });
          },
        );
      });
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
