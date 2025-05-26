import { Router } from "express";
const router = Router();
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js"; // nhớ import middleware phân quyền

// [POST] /products - Thêm sản phẩm mới
router.post("/", verifyToken, isAdmin, (req, res) => {
  console.log("📥 Nhận yêu cầu thêm sản phẩm từ:", req.user);

  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Thiếu tên hoặc giá sản phẩm" });
  }

  db.query(
    "INSERT INTO products (name, price, description) VALUES (?, ?, ?)",
    [name, price, description],
    (err, result) => {
      if (err) {
        console.error("❌ Lỗi khi thêm sản phẩm:", err);
        return res.status(500).json({ error: "Lỗi khi thêm sản phẩm" });
      }

      res.json({ message: "✅ Đã thêm sản phẩm", productId: result.insertId });
    },
  );
});

// [GET] /products - Lấy danh sách tất cả sản phẩm
router.get("/", (_req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

// ✅ [GET] /products/:id - Chi tiết sản phẩm kèm ảnh chính
router.get("/:id", (req, res) => {
  const productId = req.params.id;

  const sql = `
    SELECT 
      p.*, 
      m.url AS main_image
    FROM products p
    LEFT JOIN product_media m 
      ON p.id = m.product_id AND m.is_main = true
    WHERE p.id = ?
  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error("❌ Lỗi DB:", err);
      return res.status(500).json({ error: "Lỗi DB" });
    }
    if (results.length === 0)
      return res.status(404).json({ error: "Không tìm thấy" });

    res.json(results[0]);
  });
});

// [GET] /products/:id/media - Lấy media theo sản phẩm
router.get("/:id/media", (req, res) => {
  const productId = req.params.id;
  db.query(
    "SELECT * FROM product_media WHERE product_id = ?",
    [productId],
    (err, results) => {
      if (err) {
        console.error("Lỗi DB khi lấy media:", err);
        return res.status(500).json({ error: "Lỗi khi lấy media" });
      }
      res.json(results);
    },
  );
});

// [PUT] /products/:id - Sửa sản phẩm
router.put("/:id", verifyToken, (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  db.query(
    "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?",
    [name, description, price, stock, image_url, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Không sửa được" });
      res.json({ message: "✅ Sửa thành công" });
    },
  );
});

// [DELETE] /products/:id - Xoá sản phẩm
router.delete("/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Không xoá được" });
    res.json({ message: "🗑️ Đã xoá sản phẩm" });
  });
});

export default router;
