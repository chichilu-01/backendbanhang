import { Router } from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

/**
 * @route   GET /products
 * @desc    Lấy danh sách sản phẩm kèm URL ảnh chính (nếu có)
 * @access  Public
 */
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      p.*,
      m.url AS main_image
    FROM products p
    LEFT JOIN product_media m
      ON p.id = m.product_id
      AND m.is_main = true
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ [GET /products] Lỗi DB:", err);
      return res
        .status(500)
        .json({ error: "Lỗi khi truy vấn danh sách sản phẩm" });
    }
    res.json(rows);
  });
});

/**
 * @route   POST /products
 * @desc    Thêm sản phẩm mới
 * @access  Admin
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
      if (err) {
        console.error("❌ [POST /products] Lỗi thêm:", err);
        return res.status(500).json({ error: "Không thể thêm sản phẩm" });
      }
      res.status(201).json({
        message: "Đã tạo sản phẩm",
        productId: result.insertId,
      });
    },
  );
});

/**
 * @route   GET /products/:id
 * @desc    Lấy chi tiết 1 sản phẩm (kèm ảnh chính)
 * @access  Public
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT
      p.*,
      m.url AS main_image
    FROM products p
    LEFT JOIN product_media m
      ON p.id = m.product_id
      AND m.is_main = true
    WHERE p.id = ?
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(`❌ [GET /products/${id}] Lỗi DB:`, err);
      return res.status(500).json({ error: "Lỗi khi truy vấn sản phẩm" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    res.json(rows[0]);
  });
});

/**
 * @route   PUT /products/:id
 * @desc    Cập nhật sản phẩm
 * @access  Admin
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
      if (err) {
        console.error(`❌ [PUT /products/${id}] Lỗi DB:`, err);
        return res.status(500).json({ error: "Không thể cập nhật sản phẩm" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }
      res.json({ message: "Đã cập nhật sản phẩm" });
    },
  );
});

/**
 * @route   DELETE /products/:id
 * @desc    Xoá sản phẩm
 * @access  Admin
 */
router.delete("/:id", verifyToken, isAdmin, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error(`❌ [DELETE /products/${id}] Lỗi DB:`, err);
      return res.status(500).json({ error: "Không thể xoá sản phẩm" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }
    res.json({ message: "Đã xoá sản phẩm" });
  });
});

/**
 * @route   GET /products/:id/media
 * @desc    Lấy danh sách ảnh/video của sản phẩm
 * @access  Public
 */
router.get("/:id/media", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, type, url, is_main, uploaded_at FROM product_media WHERE product_id = ? ORDER BY uploaded_at DESC",
    [id],
    (err, rows) => {
      if (err) {
        console.error(`❌ [GET /products/${id}/media] Lỗi DB:`, err);
        return res.status(500).json({ error: "Không lấy được media" });
      }
      res.json(rows);
    },
  );
});
/**
 * @route   POST /products/upload
 * @desc    Upload media (ảnh/video) cho sản phẩm
 * @access  Admin
 */
router.post("/upload", verifyToken, isAdmin, (req, res) => {
  console.log("📥 Dữ liệu nhận:", req.body); // 👈 Ghi log dữ liệu gửi lên

  const { product_id, url, type, is_main } = req.body;

  if (!product_id || !url || !type) {
    return res.status(400).json({ error: "Thiếu thông tin media" });
  }

  // Kiểm tra sản phẩm có tồn tại không
  db.query("SELECT * FROM products WHERE id = ?", [product_id], (err, rows) => {
    if (err) {
      console.error("❌ [UPLOAD] Lỗi truy vấn sản phẩm:", err);
      return res.status(500).json({ error: "Lỗi truy vấn DB" });
    }

    if (rows.length === 0) {
      console.warn("⚠️ Không tìm thấy sản phẩm với ID:", product_id);
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    // Thêm media
    const insertQuery = `
      INSERT INTO product_media (product_id, url, type, is_main)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      insertQuery,
      [product_id, url, type, is_main || false],
      (err, result) => {
        if (err) {
          console.error("❌ [UPLOAD] Lỗi thêm media:", err);
          return res.status(500).json({ error: "Không thể thêm media" });
        }

        res
          .status(201)
          .json({ message: "✅ Đã upload media", mediaId: result.insertId });
      },
    );
  });
});

export default router;
