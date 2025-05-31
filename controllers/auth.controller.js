import { query } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";
import sendResetCodeEmail from "../utils/sendResetCodeEmail.js";

// Tạm lưu OTP và mã reset trong RAM (nâng cao sau có thể dùng Redis)
const otpStore = {}; // { email: { code, data, expires } }
const resetStore = {}; // { email: { code, expires } }

// 🔁 Hàm dùng chung để kiểm tra mã xác thực (OTP / Reset)
const isCodeValid = (store, email, code) => {
  const entry = store[email];
  if (!entry || Date.now() > entry.expires)
    return { valid: false, error: "Mã đã hết hạn." };
  if (parseInt(code) !== entry.code)
    return { valid: false, error: "Mã không chính xác." };
  return { valid: true };
};

// [POST] /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  try {
    const existing = await query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
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
  } catch (err) {
    console.error("❌ Lỗi register:", err);
    res.status(500).json({ error: "Lỗi khi xử lý đăng ký" });
  }
};

// [POST] /api/auth/verify-code
export const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const check = isCodeValid(otpStore, email, code);
  if (!check.valid) return res.status(400).json({ error: check.error });

  const { name, hashedPassword, role } = otpStore[email].data;

  try {
    await query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );
    delete otpStore[email];
    res.json({ message: "✅ Đăng ký thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm user:", err);
    res.status(500).json({ error: "Không thêm được user" });
  }
};

// [POST] /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(401).json({ error: "Email không tồn tại" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Sai mật khẩu" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }, // 🎯 giữ đăng nhập lâu hơn
    );

    res.json({
      message: "Đăng nhập thành công ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi login:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// [POST] /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(404).json({ error: "Email không tồn tại" });

    const code = Math.floor(100000 + Math.random() * 900000);
    resetStore[email] = {
      code,
      expires: Date.now() + 5 * 60 * 1000,
    };

    await sendResetCodeEmail(email, code);
    res.json({ message: "📩 Đã gửi mã đặt lại mật khẩu" });
  } catch (err) {
    console.error("❌ Lỗi forgotPassword:", err);
    res.status(500).json({ error: "Không gửi được email" });
  }
};

// [POST] /api/auth/verify-reset-code
export const verifyResetCode = (req, res) => {
  const { email, code } = req.body;
  const check = isCodeValid(resetStore, email, code);
  if (!check.valid) return res.status(400).json({ error: check.error });

  res.json({ message: "✅ Mã hợp lệ, tiếp tục đặt lại mật khẩu." });
};

// [POST] /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!resetStore[email])
    return res.status(400).json({ error: "Yêu cầu không hợp lệ" });

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = ? WHERE email = ?", [
      hashed,
      email,
    ]);
    delete resetStore[email];
    res.json({ message: "🔐 Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("❌ Lỗi resetPassword:", err);
    res.status(500).json({ error: "Không đổi được mật khẩu" });
  }
};
