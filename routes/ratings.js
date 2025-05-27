import { Router } from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();

/**
 * [POST] /ratings - Gửi đánh giá mới hoặc cập nhật nếu đã đánh giá
 */
router.post("/", verifyToken, (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  // Kiểm tra dữ liệu đầu vào
  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Thiếu hoặc sai thông tin đánh giá" });
  }

  const sql = `
    INSERT INTO product_ratings (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)
  `;

  db.query(sql, [product_id, user_id, rating, comment], (err) => {
    if (err) {
      console.error("❌ Lỗi ghi đánh giá:", err);
      return res.status(500).json({ error: "Không thể ghi đánh giá" });
    }
    res.status(201).json({ message: "✅ Đã ghi nhận đánh giá" });
  });
});

/**
 * [GET] /ratings/product/:id - Lấy danh sách đánh giá theo sản phẩm
 */
router.get("/product/:id", (req, res) => {
  const productId = req.params.id;

  const sql = `
    SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
    FROM product_ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error("❌ Lỗi lấy đánh giá:", err);
      return res
        .status(500)
        .json({ error: "Không thể lấy danh sách đánh giá" });
    }
    res.json(results);
  });
});

export default router;
