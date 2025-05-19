// routes/cart.js
import { Router } from "express";
const router = Router();
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import sendOrderEmail from "../utils/sendOrderEmail.js";

// Thêm sản phẩm vào giỏ hàng
router.post("/add", verifyToken, (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  db.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [user_id, product_id, quantity, quantity],
    (err) => {
      if (err)
        return res.status(500).json({ error: "Không thêm vào giỏ hàng" });
      res.json({ message: "🛒 Đã thêm vào giỏ hàng" });
    },
  );
});

// Lấy giỏ hàng của user
router.get("/", verifyToken, (req, res) => {
  db.query(
    `SELECT c.product_id, p.name, p.price, c.quantity
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [req.user.id],
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "Không lấy được giỏ hàng" });
      res.json(results);
    },
  );
});

// Checkout - tạo đơn hàng và gửi email
router.post("/checkout", verifyToken, (req, res) => {
  const user_id = req.user.id;

  db.query(
    `SELECT c.product_id, c.quantity, p.price, p.name
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?`,
    [user_id],
    (err, items) => {
      if (err)
        return res.status(500).json({ error: "Không lấy được giỏ hàng" });
      if (items.length === 0)
        return res.status(400).json({ error: "Giỏ hàng trống" });

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      db.query(
        "SELECT email FROM users WHERE id = ?",
        [user_id],
        (err, userRows) => {
          if (err || userRows.length === 0)
            return res
              .status(500)
              .json({ error: "Không lấy được email người dùng" });

          const email = userRows[0].email;

          db.query(
            "INSERT INTO orders (user_id, total) VALUES (?, ?)",
            [user_id, total],
            (err, result) => {
              if (err)
                return res
                  .status(500)
                  .json({ error: "Không tạo được đơn hàng" });

              const order_id = result.insertId;
              const values = items.map((item) => [
                order_id,
                item.product_id,
                item.quantity,
                item.price,
              ]);

              db.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
                [values],
                async (err) => {
                  if (err)
                    return res
                      .status(500)
                      .json({ error: "Không lưu chi tiết đơn hàng" });

                  db.query("DELETE FROM cart_items WHERE user_id = ?", [
                    user_id,
                  ]);
                  await sendOrderEmail(email, order_id, total, items);
                  res.json({
                    message: "🧾 Đã tạo đơn hàng và gửi email xác nhận",
                    order_id,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
});

export default router;
