import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { query } from "../db.js";

const router = Router();

// [GET] /users - lấy toàn bộ users
router.get("/", (_req, res) => {
  query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

// [POST] /users - đăng ký (hash password)
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
    [name, email, hashed],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Không thêm được user" });
      res.json({ message: "✅ Đăng ký thành công", id: result.insertId });
    }
  );
});

// [POST] /users/login - dùng bcrypt để kiểm tra
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  query("SELECT * FROM users WHERE email = ?", [email], async*
