// controllers/auth.controller.js
import { query } from "../db.js";
import bcrypt from "bcrypt"; // hoặc "bcryptjs"
import jwt from "jsonwebtoken";

// [POST] /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  try {
    query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, results) => {
        if (err) return res.status(500).json({ error: "Lỗi kiểm tra email" });
        if (results.length > 0)
          return res.status(400).json({ error: "Email đã được sử dụng" });

        const hashedPassword = await bcrypt.hash(password, 10);

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
  } catch {
    res.status(500).json({ error: "Lỗi khi mã hóa mật khẩu" });
  }
};

// [POST] /api/auth/login
export const login = (req, res) => {
  const { email, password } = req.body;
  query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi server" });
      if (results.length === 0)
        return res.status(401).json({ error: "Email không tồn tại" });

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Sai mật khẩu" });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      res.json({ message: "Đăng nhập thành công ✅", token });
    },
  );
};
