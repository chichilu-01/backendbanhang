import { query } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";
import sendResetCodeEmail from "../utils/sendResetCodeEmail.js";

const otpStore = {}; // Đăng ký: { email: { code, data, expires } }
const resetStore = {}; // Quên mật khẩu: { email: { code, expires } }

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
        const otp = Math.floor(100000 + Math.random() * 900000);

        otpStore[email] = {
          code: otp,
          data: { name, email, hashedPassword, role },
          expires: Date.now() + 5 * 60 * 1000,
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

  query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, role],
    (err) => {
      if (err) {
        console.error("❌ Lỗi thêm user:", err);
        return res.status(500).json({ error: "Không thêm được user" });
      }

      delete otpStore[email];
      res.json({ message: "✅ Đăng ký thành công!" });
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

// [POST] /api/auth/forgot-password
export const forgotPassword = (req, res) => {
  const { email } = req.body;

  query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi DB" });
      if (results.length === 0)
        return res.status(404).json({ error: "Email không tồn tại" });

      const code = Math.floor(100000 + Math.random() * 900000);
      resetStore[email] = {
        code,
        expires: Date.now() + 5 * 60 * 1000,
      };

      try {
        await sendResetCodeEmail(email, code);
        res.json({ message: "📩 Đã gửi mã đặt lại mật khẩu" });
      } catch {
        res.status(500).json({ error: "Không gửi được email" });
      }
    },
  );
};

// [POST] /api/auth/verify-reset-code
export const verifyResetCode = (req, res) => {
  const { email, code } = req.body;

  const entry = resetStore[email];
  if (!entry || Date.now() > entry.expires)
    return res.status(400).json({ error: "Mã đã hết hạn." });

  if (parseInt(code) !== entry.code)
    return res.status(400).json({ error: "Mã không chính xác." });

  res.json({ message: "✅ Mã hợp lệ, tiếp tục đặt lại mật khẩu." });
};

// [POST] /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const entry = resetStore[email];

  if (!entry) return res.status(400).json({ error: "Yêu cầu không hợp lệ" });

  const hashed = await bcrypt.hash(newPassword, 10);

  query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashed, email],
    (err) => {
      if (err) {
        console.error("❌ Lỗi đổi mật khẩu:", err);
        return res.status(500).json({ error: "Không đổi được mật khẩu" });
      }

      delete resetStore[email];
      res.json({ message: "🔐 Đặt lại mật khẩu thành công!" });
    },
  );
};
