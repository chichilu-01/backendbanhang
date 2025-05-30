import { Router } from "express";
const router = Router();
import { query } from "../db.js"; // Dùng query wrapper async
import verifyToken from "../middleware/verifyToken.js";
import sendOrderEmail from "../utils/sendOrderEmail.js";

// 🛒 Thêm sản phẩm vào giỏ hàng
router.post("/add", verifyToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [user_id, product_id, quantity, quantity]
    );
    res.json({ message: "🛒 Đã thêm vào giỏ hàng" });
  } catch (err) {
    console.error("❌ Lỗi khi thêm vào giỏ:", err);
    res.status(500).json({ error: "Không thêm vào giỏ hàng" });
  }
});

// 🧾 Lấy giỏ hàng người dùng
router.get("/", verifyToken, async (req, res) => {
  try {
    const cart = await query(
      `SELECT c.product_id, p.name, p.price, c.quantity
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json(cart);
  } catch (err) {
    console.error("❌ Lỗi khi lấy giỏ hàng:", err);
    res.status(500).json({ error: "Không lấy được giỏ hàng" });
  }
});

// ✅ Thanh toán (checkout)
router.post("/checkout", verifyToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const items = await query(
      `SELECT c.product_id, c.quantity, p.price, p.name
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [user_id]
    );

    if (items.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const userRows = await query(
      "SELECT email FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0) {
      return res
        .status(500)
        .json({ error: "Không lấy được email người dùng" });
    }

    const email = userRows[0].email;

    const orderResult = await query(
      "INSERT INTO orders (user_id, total) VALUES (?, ?)",
      [user_id, total]
    );

    const order_id = orderResult.insertId;
    const values = items.map((item) => [
      order_id,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    // Lưu chi tiết đơn hàng
    await query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [values]
    );

    // Xoá giỏ hàng
    await query("DELETE FROM cart_items WHERE user_id = ?", [user_id]);

    // Gửi email xác nhận
    await sendOrderEmail(email, order_id, total, items);

    res.json({
      message: "🧾 Đã tạo đơn hàng và gửi email xác nhận",
      order_id,
    });
  } catch (err) {
    console.error("❌ Lỗi khi checkout:", err);
    res.status(500).json({ error: "Có lỗi khi thanh toán" });
  }
});

export default router;
