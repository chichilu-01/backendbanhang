import { Router } from "express";
const router = Router();
import { query } from "../db.js";

router.get("/", (_req, res) => {
  query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

router.post("/", (req, res) => {
  const { name, email, password } = req.body;
  query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Không thêm được user" });
      res.json({ message: "✅ Đăng ký thành công", id: result.insertId });
    },
  );
});

export default router;
import jwt from "jsonwebtoken";
const { sign } = jwt;

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (results.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu sai" });
    }

    const user = results[0];
    const token = sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ message: "Đăng nhập thành công ✅", token });
  });
});
