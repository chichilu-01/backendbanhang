import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // hoặc bcryptjs nếu bạn dùng gói đó
import { query } from "../db.js";

const router = Router();

// [GET] /users - Lấy danh sách user
router.get("/", (_req, res) => {
  query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

// [POST] /users - Đăng ký tài khoản
router.post("/", async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  try {
    // 🔍 Kiểm tra email đã tồn tại chưa
    query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi kiểm tra email" });
        if (results.length > 0) {
          return res.status(400).json({ error: "Email đã được sử dụng" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // mã hóa

        query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          [name, email, hashedPassword, role],
          (err, result) => {
            if (err) {
              console.error("❌ Lỗi khi insert user:", err);
              return res.status(500).json({ error: "Không thêm được user" });
            }

            res.json({ message: "✅ Đăng ký thành công", id: result.insertId });
          },
        );
      },
    );
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi mã hóa mật khẩu" });
  }
});

// [POST] /users/login - Đăng nhập
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi server" });
    if (results.length === 0) {
      return res.status(401).json({ error: "Email không tồn tại" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ message: "Đăng nhập thành công ✅", token });
  });
});

export default router;
