// routes/media.js
import { Router } from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

// [GET] /media/product/:id - Lấy danh sách media của sản phẩm
db;
router.get("/product/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, type, url, is_main, uploaded_at FROM product_media WHERE product_id = ? ORDER BY uploaded_at DESC",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Không lấy được media" });
      res.json(rows);
    },
  );
});

// [POST] /media/upload - Upload media mới
router.post("/upload", verifyToken, isAdmin, (req, res) => {
  const { product_id, url, type, is_main } = req.body;

  if (!product_id || !url || !type) {
    return res.status(400).json({ error: "Thiếu thông tin media" });
  }

  db.query("SELECT * FROM products WHERE id = ?", [product_id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    db.query(
      "INSERT INTO product_media (product_id, url, type, is_main) VALUES (?, ?, ?, ?)",
      [product_id, url, type, is_main || false],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Không thể thêm media" });
        res
          .status(201)
          .json({ message: "✅ Đã upload media", mediaId: result.insertId });
      },
    );
  });
});

// [DELETE] /media/:id - Xoá media
router.delete("/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM product_media WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Không thể xoá media" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    res.json({ message: "✅ Đã xoá media" });
  });
});

// [PATCH] /media/:id/set-main - Đặt media làm ảnh chính
router.patch("/:id/set-main", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT product_id FROM product_media WHERE id = ?",
    [id],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy media" });
      }

      const productId = rows[0].product_id;

      db.query(
        "UPDATE product_media SET is_main = 0 WHERE product_id = ?",
        [productId],
        (err) => {
          if (err)
            return res
              .status(500)
              .json({ error: "Không thể cập nhật ảnh chính" });

          db.query(
            "UPDATE product_media SET is_main = 1 WHERE id = ?",
            [id],
            (err2) => {
              if (err2)
                return res
                  .status(500)
                  .json({ error: "Không thể đặt ảnh chính" });
              res.json({ message: "✅ Đã đặt ảnh chính" });
            },
          );
        },
      );
    },
  );
});

export default router;
