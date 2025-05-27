// routes/products.js
import { Router } from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

// [GET] /products - Lấy danh sách sản phẩm (kèm ảnh chính)
router.get("/", (_req, res) => {
  const sql = `
    SELECT p.*, m.url AS main_image
    FROM products p
    LEFT JOIN product_media m ON p.id = m.product_id AND m.is_main = true
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Lỗi truy vấn sản phẩm" });
    res.json(rows);
  });
});

// [POST] /products - Thêm sản phẩm mới
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

// [GET] /products/:id - Lấy chi tiết sản phẩm (kèm ảnh chính)
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

// [PUT] /products/:id - Cập nhật sản phẩm
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

// [DELETE] /products/:id - Xoá sản phẩm
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

export default router;
