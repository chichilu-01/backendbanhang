import { Router } from "express";
const router = Router();
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

// Lấy toàn bộ đơn hàng (chỉ admin)
router.get("/orders", verifyToken, isAdmin, (_req, res) => {
  db.query(
    `
    SELECT o.id AS order_id, o.user_id, o.total, o.status, o.created_at,
           oi.product_id, oi.quantity, oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
  `,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi DB" });
      res.json(results);
    },
  );
});

// (Tùy chọn) cập nhật trạng thái đơn hàng
router.put("/orders/:id/status", verifyToken, isAdmin, (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Không cập nhật được trạng thái" });
      res.json({ message: "✅ Đã cập nhật trạng thái đơn hàng" });
    },
  );
});

export default router;

/*
📌 (Tuỳ chọn) Gán quyền admin cho 1 tài khoản:
Vào DBeaver hoặc bất kỳ công cụ SQL client nào và chạy lệnh sau:

INSERT INTO users (name, email, password, role)
VALUES (
  'Admin Phuong',
  'hoangminhphuong270401@gmail.com',
  '$2b$10$qsmF4yHsoElghZ6T5SpGdu1qys3liDffcfqf7O.bZ1qkZy9oMeSxS',
  'admin'
);

-- Mật khẩu ở trên tương ứng với: 01216419493
*/
