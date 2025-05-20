import { Router } from "express";
import jwt from "jsonwebtoken";
const router = Router();
import { query } from "../db.js";

// [GET] /users - lấy toàn bộ users
router.get("/", (_req, res) => {
  query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

// [POST] /users - đăng ký
router.post("/", (req, res) => {
  const { name, email, password } = req.body;
  query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
    [name, email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Không thêm được user" });
      res.json({ message: "✅ Đăng ký thành công", id: result.insertId });
    },
  );
});

// [POST] /users/login - đăng nhập
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (results.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu sai" });
    }

    const user = results[0];

    // ✅ đưa cả role vào token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role, // 👈 rất quan trọng
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ gửi cả token và role cho frontend
    res.json({
      message: "Đăng nhập thành công ✅",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });
});

export default router;
