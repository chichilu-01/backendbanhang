import { Router } from "express";
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

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
router.post("/upload", verifyToken, isAdmin, async (req, res) => {
  const { product_id, url, type, is_main } = req.body;

  if (!product_id || !url || !type) {
    return res.status(400).json({ error: "Thiếu thông tin media" });
  }

  try {
    const rows = await query("SELECT * FROM products WHERE id = ?", [
      product_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    const result = await query(
      "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, ?, ?)",
      [product_id, url, type, is_main || false],
    );

    res
      .status(201)
      .json({ message: "✅ Đã upload media", mediaId: result.insertId });
  } catch (err) {
    console.error("❌ Lỗi upload media:", err);
    res.status(500).json({ error: "Không thể thêm media" });
  }
});

/**
 * [DELETE] /media/:id - Xoá media
 */
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

/**
 * [PATCH] /media/:id/set-main - Đặt media làm ảnh chính
 */
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
