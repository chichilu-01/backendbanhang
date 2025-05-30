import { Router } from "express";
const router = Router();
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

/**
 * [GET] /orders - Lấy toàn bộ đơn hàng (chỉ admin)
 */
router.get("/orders", verifyToken, isAdmin, async (_req, res) => {
  try {
    const results = await query(`
      SELECT o.id AS order_id, o.user_id, o.total, o.status, o.created_at,
             oi.product_id, oi.quantity, oi.price
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
    `);
    res.json(results);
  } catch (err) {
    console.error("❌ Lỗi truy vấn đơn hàng:", err);
    res.status(500).json({ error: "Lỗi DB" });
  }
});

/**
 * [PUT] /orders/:id/status - Cập nhật trạng thái đơn hàng (admin)
 */
router.put("/orders/:id/status", verifyToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  try {
    await query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    res.json({ message: "✅ Đã cập nhật trạng thái đơn hàng" });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    res.status(500).json({ error: "Không cập nhật được trạng thái" });
  }
});

export default router;
