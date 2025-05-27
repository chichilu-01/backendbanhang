import { Router } from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

/**
 * [GET] /products - Lấy danh sách sản phẩm (kèm ảnh chính)
 */
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      p.*, m.url AS main_image
    FROM products p
    LEFT JOIN product_media m ON p.id = m.product_id AND m.is_main = true
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn sản phẩm" });
    res.json(rows);
  });
});

/**
 * [POST] /products - Thêm sản phẩm mới
 */
router.post("/", verifyToken, isAdmin, (req, res) => {
  const { name, price, description } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: "Thiếu tên hoặc giá sản phẩm" });
  }

  db.query(
    "INSERT INTO products (name, price, description) VALUES (?, ?, ?)",
    [name, price, description],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Không thể thêm sản phẩm" });
      res
        .status(201)
        .json({ message: "Đã tạo sản phẩm", productId: result.insertId });
    },
  );
});

/**
 * [GET] /products/:id - Lấy chi tiết sản phẩm (kèm ảnh chính)
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT p.*, m.url AS main_image
    FROM products p
    LEFT JOIN product_media m ON p.id = m.product_id AND m.is_main = true
    WHERE p.id = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn sản phẩm" });
    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(rows[0]);
  });
});

/**
 * [PUT] /products/:id - Cập nhật sản phẩm
 */
router.put("/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: "Thiếu tên hoặc giá sản phẩm" });
  }

  db.query(
    "UPDATE products SET name=?, description=?, price=? WHERE id=?",
    [name, description, price, id],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Không thể cập nhật sản phẩm" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }
      res.json({ message: "Đã cập nhật sản phẩm" });
    },
  );
});

/**
 * [DELETE] /products/:id - Xoá sản phẩm
 */
router.delete("/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Không thể xoá sản phẩm" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    res.json({ message: "Đã xoá sản phẩm" });
  });
});

/**
 * [GET] /products/:id/media - Lấy danh sách media của sản phẩm
 */
router.get("/:id/media", (req, res) => {
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

/**
 * [POST] /products/upload - Upload media mới
 */
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

/**
 * [DELETE] /products/upload/:id - Xoá media
 */
router.delete("/upload/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM product_media WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Không thể xoá media" });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    res.json({ message: "✅ Đã xoá media" });
  });
});

/**
 * [PATCH] /products/upload/:id/set-main - Đặt media làm ảnh chính
 */
router.patch("/upload/:id/set-main", verifyToken, isAdmin, (req, res) => {
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
