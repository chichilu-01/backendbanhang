import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Tạo pool kết nối
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ✅ Hàm kiểm tra kết nối (optional)
const testConnection = async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Đã kết nối MySQL database.");
    conn.release();
  } catch (err) {
    console.error("❌ Kết nối DB thất bại:", err);
  }
};

// Gọi kiểm tra nếu đang ở môi trường dev
if (process.env.NODE_ENV !== "production") {
  testConnection();
}

// ✅ Wrapper gọn gàng
export const query = async (...args) => {
  const [rows] = await db.query(...args);
  return rows;
};

export default db;
