import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import orderRoutes from "./routes/orders.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import protectedRoutes from "./routes/protected.js";
import adminRoutes from "./routes/admin.js";
import cartRoutes from "./routes/cart.js";
import reviewRoutes from "./routes/reviews.js";
import authRoutes from "./routes/auth.js"; // ✅ mới thêm
import "./db.js"; // mở kết nối MySQL
import uploadRoutes from "./routes/upload.js";

dotenv.config(); // load biến môi trường từ .env

const app = express();

app.use(
  cors({
    origin: "https://frontendbanhang.vercel.app", // 👈 domain của frontend
    credentials: true,
  }),
);

app.use(express.json());
// Cho phép truy cập file ảnh/video trong thư mục uploads/
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.send("🟢 Backend đang chạy trên Replit!"));

// ✅ Route đăng ký & đăng nhập
app.use("/api/auth", authRoutes);

// ✅ Các route khác
app.use("/orders", orderRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/protected", protectedRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/reviews", reviewRoutes);
app.use("/api", uploadRoutes); // ✅ gắn trực tiếp vào /api

// ✅ Route kiểm tra hệ thống
app.get("/health", (_req, res) => res.send("✅ API OK"));

// Middleware xử lý lỗi
app.use((err, _req, res, _next) => {
  console.error("❌ Lỗi:", err.stack);
  res.status(500).json({ error: "Lỗi server" });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
