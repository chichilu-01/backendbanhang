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

// ⚙️ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================
// ✅ Helper: kiểm tra sản phẩm có ảnh chưa
// =============================================
async function getIsMainValue(product_id) {
  const rows = await query(
    "SELECT COUNT(*) AS total FROM product_media WHERE product_id = ?",
    [product_id],
  );
  return rows[0].total === 0 ? 1 : 0; // nếu chưa có ảnh → ảnh đầu = main
}

// =============================================
// ✅ Upload từ URL
// =============================================
router.post("/upload", verifyToken, isAdmin, async (req, res) => {
  try {
    const { url, product_id } = req.body;
    if (!url || !product_id)
      return res.status(400).json({ error: "Thiếu thông tin" });

    const is_main = await getIsMainValue(product_id);

    const result = await cloudinary.uploader.upload(url, {
      folder: "products",
    });

    await query(
      "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, 'image', ?)",
      [product_id, result.secure_url, is_main],
    );

    res.json({ message: "✅ Upload thành công", url: result.secure_url });
  } catch (err) {
    console.error("❌ Upload từ URL lỗi:", err);
    res.status(500).json({ error: "Không thể upload ảnh từ URL" });
  }
});

// =============================================
// ✅ Upload từ File
// =============================================
router.post(
  "/upload-file",
  verifyToken,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const { product_id } = req.body;
      if (!product_id)
        return res.status(400).json({ error: "Thiếu product_id" });

      const filePath = req.file.path;

      const is_main = await getIsMainValue(product_id);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "products",
      });

      await fs.unlink(filePath);

      await query(
        "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, 'image', ?)",
        [product_id, result.secure_url, is_main],
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

// =============================================
// ✅ Lấy danh sách media theo sản phẩm
// (ảnh chính sẽ luôn đứng đầu)
// =============================================
router.get("/product/:id", async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, type, url, is_main, uploaded_at 
       FROM product_media 
       WHERE product_id = ?
       ORDER BY is_main DESC, uploaded_at DESC`,
      [req.params.id],
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy media:", err);
    res.status(500).json({ error: "Không lấy được media" });
  }
});

// =============================================
// ✅ Xoá ảnh theo ID
// =============================================
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await query("DELETE FROM product_media WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    res.json({ message: "✅ Đã xoá media" });
  } catch (err) {
    console.error("❌ Lỗi xoá media:", err);
    res.status(500).json({ error: "Không thể xoá media" });
  }
});

// =============================================
// ✅ Đặt ảnh chính (set-main)
// =============================================
router.patch("/:id/set-main", verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await query(
      "SELECT product_id FROM product_media WHERE id = ?",
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const productId = rows[0].product_id;

    await query("UPDATE product_media SET is_main = 0 WHERE product_id = ?", [
      productId,
    ]);

    await query("UPDATE product_media SET is_main = 1 WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ message: "✅ Đã đặt ảnh chính" });
  } catch (err) {
    console.error("❌ Lỗi đặt ảnh chính:", err);
    res.status(500).json({ error: "Không thể cập nhật ảnh chính" });
  }
});

export default router;
