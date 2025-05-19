import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT), // ✅ ép kiểu để tránh lỗi
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Kết nối DB thất bại:", err);
  } else {
    console.log("✅ Đã kết nối MySQL database.");
  }
});

// ✅ Cho phép dùng query ở các file khác
export const query = (...args) => db.query(...args);

export default db;
