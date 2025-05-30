import { Router } from "express";
const router = Router();
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

// 🧾 Tạo đơn hàng mới
router.post("/", verifyToken, async (req, res) => {
  const { items, total } = req.body; // items: [{product_id, quantity, price}]
  const userId = req.user.id;

  try {
    const result = await query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [userId, total],
    );
    const orderId = result.insertId;

    const values = items.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    await query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [values],
    );

    res.json({ message: "✅ Đã tạo đơn hàng", orderId });
  } catch (err) {
    console.error("❌ Lỗi khi tạo đơn hàng:", err);
    res.status(500).json({ error: "Không tạo được đơn hàng" });
  }
});

// 📦 Lấy danh sách đơn hàng của người dùng
router.get("/my", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const results = await query(
      `SELECT o.id AS order_id, o.total, o.status, o.created_at, 
              oi.product_id, oi.quantity, oi.price 
       FROM orders o 
       JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ?`,
      [userId],
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Lỗi khi lấy đơn hàng:", err);
    res.status(500).json({ error: "Không lấy được đơn hàng" });
  }
});

export default router;
