import { query } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";

const otpStore = {}; // Lưu mã xác nhận tạm thời: { email: { code, data } }

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
        const otp = Math.floor(100000 + Math.random() * 900000); // Mã 6 số

        otpStore[email] = {
          code: otp,
          data: { name, email, hashedPassword, role },
          expires: Date.now() + 5 * 60 * 1000, // hết hạn sau 5 phút
        };

        await sendVerificationEmail(email, otp);
        res.json({ message: "📩 Mã xác nhận đã gửi đến email" });
      },
    );
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi xử lý đăng ký" });
  }
};

// [POST] /api/auth/verify-code
export const verifyCode = (req, res) => {
  const { email, code } = req.body;

  const entry = otpStore[email];
  if (!entry || Date.now() > entry.expires)
    return res
      .status(400)
      .json({ error: "Mã đã hết hạn, vui lòng đăng ký lại." });

  if (parseInt(code) !== entry.code)
    return res.status(400).json({ error: "Mã không chính xác." });

  const { name, hashedPassword, role } = entry.data;

  // Thêm user vào DB
  query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role],
    (err, result) => {
      if (err) {
        console.error("❌ Lỗi thêm user sau xác nhận:", err);
        return res.status(500).json({ error: "Không thêm được user" });
      }

      delete otpStore[email]; // Xoá OTP sau khi dùng
      res.json({ message: "✅ Xác nhận thành công. Tài khoản đã được tạo." });
    },
  );
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
