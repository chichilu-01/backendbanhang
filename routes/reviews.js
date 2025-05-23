import { Router } from "express";
const router = Router();
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

// Gửi đánh giá
router.post("/", verifyToken, (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  query(
    `INSERT INTO reviews (user_id, product_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [user_id, product_id, rating, comment],
    (err) => {
      if (err)
        return res.status(500).json({ error: "Không gửi được đánh giá" });
      res.json({ message: "✅ Đã gửi đánh giá" });
    },
  );
});

// Lấy đánh giá theo sản phẩm
router.get("/:product_id", (req, res) => {
  const product_id = req.params.product_id;
  query(
    `SELECT r.rating, r.comment, r.created_at, u.name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [product_id],
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "Không lấy được đánh giá" });
      res.json(results);
    },
  );
});

export default router;
