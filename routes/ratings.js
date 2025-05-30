import { Router } from "express";
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();

/**
 * [POST] /ratings - Gửi đánh giá mới hoặc cập nhật nếu đã đánh giá
 */
router.post("/", verifyToken, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Thiếu hoặc sai thông tin đánh giá" });
  }

  const sql = `
    INSERT INTO product_ratings (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)
  `;

  try {
    await query(sql, [product_id, user_id, rating, comment]);
    res.status(201).json({ message: "✅ Đã ghi nhận đánh giá" });
  } catch (err) {
    console.error("❌ Lỗi ghi đánh giá:", err);
    res.status(500).json({ error: "Không thể ghi đánh giá" });
  }
});

/**
 * [GET] /ratings/product/:id - Lấy danh sách đánh giá theo sản phẩm
 */
router.get("/product/:id", async (req, res) => {
  const productId = req.params.id;

  const sql = `
    SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
    FROM product_ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `;

  try {
    const ratings = await query(sql, [productId]);
    res.json(ratings);
  } catch (err) {
    console.error("❌ Lỗi lấy đánh giá:", err);
    res.status(500).json({ error: "Không thể lấy danh sách đánh giá" });
  }
});

export default router;
