import { Router } from "express";
const router = Router();
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import sendOrderEmail from "../utils/sendOrderEmail.js"; // ✅ thêm vào

// 🧾 Tạo đơn hàng mới
router.post("/", verifyToken, async (req, res) => {
  const { items, total } = req.body; // items: [{product_id, quantity, price, name}]
  const userId = req.user.id;
  const userEmail = req.user.email || null; // ✅ Lấy email từ token (nếu backend có decode)
  const userName = req.user.name || "Khách hàng"; // ✅ fallback tên

  if (!items?.length || !total) {
    return res.status(400).json({ error: "Thiếu dữ liệu đơn hàng." });
  }

  try {
    // 🧩 1️⃣ Lưu đơn hàng chính
    const result = await query(
      "INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, NOW())",
      [userId, total],
    );
    const orderId = result.insertId;

    // 🧩 2️⃣ Lưu chi tiết từng sản phẩm
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

    // 🧩 3️⃣ Gửi email xác nhận (nếu có email hợp lệ)
    if (userEmail) {
      try {
        await sendOrderEmail(userEmail, orderId, total, items);
        console.log(`📧 Email xác nhận gửi tới ${userEmail}`);
      } catch (mailErr) {
        console.error("⚠️ Gửi email thất bại:", mailErr);
      }
    }

    // ✅ 4️⃣ Phản hồi về frontend
    res.json({
      message: "✅ Đã tạo đơn hàng",
      orderId,
      emailSent: !!userEmail,
    });
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
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId],
    );
    res.json(results);
  } catch (err) {
    console.error("❌ Lỗi khi lấy đơn hàng:", err);
    res.status(500).json({ error: "Không lấy được đơn hàng" });
  }
});

export default router;
