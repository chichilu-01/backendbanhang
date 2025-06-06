// 📁 backend/routes/mediaRoutes.js
import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs/promises";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";
import { query } from "../db.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// ⚙️ Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Upload từ URL ảnh → Cloudinary → DB
router.post("/upload", verifyToken, isAdmin, async (req, res) => {
  try {
    const { url, product_id, is_main } = req.body;
    if (!url || !product_id)
      return res.status(400).json({ error: "Thiếu thông tin" });

    const result = await cloudinary.uploader.upload(url, {
      folder: "products",
    });

    await query(
      "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, ?, ?)",
      [product_id, result.secure_url, "image", is_main || false],
    );

    res.json({ message: "✅ Upload thành công", url: result.secure_url });
  } catch (err) {
    console.error("❌ Upload từ URL lỗi:", err);
    res.status(500).json({ error: "Không thể upload ảnh từ URL" });
  }
});

// ✅ Upload từ file → Cloudinary → DB
router.post(
  "/upload-file",
  verifyToken,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const { product_id, is_main } = req.body;
      const filePath = req.file.path;

      if (!product_id)
        return res.status(400).json({ error: "Thiếu product_id" });

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "products",
      });
      await fs.unlink(filePath);

      await query(
        "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, ?, ?)",
        [product_id, result.secure_url, "image", is_main || false],
      );

      res.json({
        message: "✅ Upload file thành công",
        url: result.secure_url,
      });
    } catch (err) {
      console.error("❌ Upload từ file lỗi:", err);
      res.status(500).json({ error: "Không thể upload ảnh từ file" });
    }
  },
);

// ✅ GET /media/product/:id
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

// ✅ DELETE /media/:id
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM product_media WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    res.json({ message: "✅ Đã xoá media" });
  } catch (err) {
    console.error("❌ Lỗi xoá media:", err);
    res.status(500).json({ error: "Không thể xoá media" });
  }
});

// ✅ PATCH /media/:id/set-main
router.patch("/:id/set-main", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await query(
      "SELECT product_id FROM product_media WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const productId = rows[0].product_id;

    await query("UPDATE product_media SET is_main = 0 WHERE product_id = ?", [
      productId,
    ]);
    await query("UPDATE product_media SET is_main = 1 WHERE id = ?", [id]);

    res.json({ message: "✅ Đã đặt ảnh chính" });
  } catch (err) {
    console.error("❌ Lỗi đặt ảnh chính:", err);
    res.status(500).json({ error: "Không thể cập nhật ảnh chính" });
  }
});

export default router;
