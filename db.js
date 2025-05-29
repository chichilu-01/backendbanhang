// db.js
import mysql from "mysql2/promise"; // ✅ Dùng bản Promise
import dotenv from "dotenv";
dotenv.config();

// ✅ Tạo pool kết nối tự động
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ✅ Nếu cần kiểm tra kết nối DB (optional)
try {
  const conn = await db.getConnection();
  console.log("✅ Đã kết nối MySQL database.");
  conn.release();
} catch (err) {
  console.error("❌ Kết nối DB thất bại:", err);
}
export const query = async (...args) => {
  const [rows] = await db.query(...args);
  return rows;
};

export default db;
