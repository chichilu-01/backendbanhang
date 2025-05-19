import { Router } from "express";
const router = Router();
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

// Tạo đơn hàng mới
router.post("/", verifyToken, (req, res) => {
  const { items, total } = req.body; // items: [{product_id, quantity, price}]
  const userId = req.user.id;

  db.query(
    "INSERT INTO orders (user_id, total) VALUES (?, ?)",
    [userId, total],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Không tạo được đơn hàng" });
      const orderId = result.insertId;

      const values = items.map((item) => [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
      ]);
      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [values],
        (err2) => {
          if (err2)
            return res
              .status(500)
              .json({ error: "Không thêm sản phẩm vào đơn hàng" });
          res.json({ message: "✅ Đã tạo đơn hàng", orderId });
        },
      );
    },
  );
});

// Lấy đơn hàng của người dùng
router.get("/my", verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT o.id AS order_id, o.total, o.status, o.created_at, 
            oi.product_id, oi.quantity, oi.price 
     FROM orders o 
     JOIN order_items oi ON o.id = oi.order_id 
     WHERE o.user_id = ?`,
    [userId],
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "Không lấy được đơn hàng" });
      res.json(results);
    },
  );
});

export default router;
