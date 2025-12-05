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

// 🔥 CẦN SỬA: Loại bỏ 'await' để tránh timeout khi đăng ký
sendVerificationEmail(email, otp).catch(err => {
console.error("❌ Lỗi gửi email xác nhận sau khi response:", err);
});

    // ✅ Trả lời client ngay lập tức sau khi lưu OTP vào RAM
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

// ✅ SỬA LOGIC BẢO MẬT: Luôn trả về 200/thông báo chung
if (users.length === 0) {
// 💡 Trả về thông báo thành công chung để ẩn sự tồn tại của email
return res.json({ message: "📩 Đã gửi mã đặt lại mật khẩu" });
}

const code = Math.floor(100000 + Math.random() * 900000);
resetStore[email] = {
code,
expires: Date.now() + 5 * 60 * 1000,
};

sendResetCodeEmail(email, code).catch(err => {
console.error("❌ Lỗi gửi email sau khi response:", err);
});

res.json({ message: "📩 Đã gửi mã đặt lại mật khẩu" });
} catch (err) {
console.error("❌ Lỗi forgotPassword:", err);
res.status(500).json({ error: "Lỗi server khi xử lý yêu cầu." });
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

// [PUT] /api/auth/profile
export const updateProfile = async (req, res) => {
  const userId = req.user.id; // Lấy từ verifyToken
  const { name, email, phone, birthday, gender, address } = req.body;

  try {
    // ===== Validate bắt buộc =====
    if (!name || !email) {
      return res.status(400).json({ error: "Tên và Email là bắt buộc" });
    }

    // ===== Kiểm tra email trùng =====
    const exists = await query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId],
    );

    if (exists.length > 0) {
      return res.status(400).json({
        error: "Email này đã được dùng bởi tài khoản khác",
      });
    }

    // ===== Update DB =====
    await query(
      `
      UPDATE users SET 
        name = ?, 
        email = ?, 
        phone = ?, 
        birthday = ?, 
        gender = ?, 
        address = ?
      WHERE id = ?
    `,
      [name, email, phone, birthday, gender, address, userId],
    );

    // ===== Lấy user mới =====
    const [updated] = await query(
      `SELECT id, name, email, phone, birthday || null, gender, address, role 
       FROM users WHERE id = ?`,
      [userId],
    );

    res.json({
      message: "Cập nhật thông tin thành công!",
      user: updated,
    });
  } catch (err) {
    console.error("❌ updateProfile error:", err);
    res.status(500).json({ error: "Lỗi server khi cập nhật hồ sơ" });
  }
};

// [PUT] /api/auth/change-password
export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ error: "Thiếu thông tin" });

  try {
    // Lấy user
    const rows = await query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy user" });

    const user = rows[0];

    // Check mật khẩu cũ
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      return res.status(400).json({ error: "Mật khẩu cũ không đúng" });

    // Hash mật khẩu mới
    const hashed = await bcrypt.hash(newPassword, 10);

    await query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

    res.json({ message: "🔐 Đổi mật khẩu thành công!" });
  } catch (err) {
    console.error("❌ changePassword error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await query(
      "SELECT id, name, email, phone, birthday, gender, address, role FROM users WHERE id = ?",
      [userId],
    );

    res.json({ user: rows });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Không lấy được thông tin user" });
  }
};
