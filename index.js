import dotenv from "dotenv";
dotenv.config(); // ✅ Load biến môi trường trước khi dùng DB

import express from "express";
import cors from "cors";
import morgan from "morgan";

// ✅ Khởi tạo app trước khi dùng middleware
const app = express();

console.log("📦 Import DB...");
import "./db.js";

// ✅ Middleware
app.use(
  cors({
    origin: "https://frontendbanhang.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev")); // 👉 log các request ra console

// ✅ Import route từng cái với log để dễ debug
console.log("🔄 Import authRoutes...");
import authRoutes from "./routes/auth.js";
console.log("✅ Done authRoutes");

console.log("🔄 Import userRoutes...");
import userRoutes from "./routes/users.js";
console.log("✅ Done userRoutes");

console.log("🔄 Import adminRoutes...");
import adminRoutes from "./routes/admin.js";
console.log("✅ Done adminRoutes");

console.log("🔄 Import protectedRoutes...");
import protectedRoutes from "./routes/protected.js";
console.log("✅ Done protectedRoutes");

console.log("🔄 Import productRoutes...");
import productRoutes from "./routes/products.js";
console.log("✅ Done productRoutes");

console.log("🔄 Import cartRoutes...");
import cartRoutes from "./routes/cart.js";
console.log("✅ Done cartRoutes");

console.log("🔄 Import orderRoutes...");
import orderRoutes from "./routes/orders.js";
console.log("✅ Done orderRoutes");

console.log("🔄 Import reviewRoutes...");
import reviewRoutes from "./routes/reviews.js";
console.log("✅ Done reviewRoutes");

console.log("🔄 Import ratingsRoutes...");
import ratingsRoutes from "./routes/ratings.js";
console.log("✅ Done ratingsRoutes");

console.log("🔄 Import uploadRoutes...");
import uploadRoutes from "./routes/upload.js";
console.log("✅ Done uploadRoutes");

console.log("🔄 Import mediaRoutes...");
import mediaRoutes from "./routes/media.js";
console.log("✅ Done mediaRoutes");

// ✅ Các endpoint test nhanh
app.get("/", (_req, res) => res.send("🟢 Backend đang chạy!"));
app.get("/health", (_req, res) => res.send("✅ API OK"));

// ✅ Gắn route với log
console.log("🔗 Gắn /api/auth");
app.use("/api/auth", authRoutes);

console.log("🔗 Gắn /api/users");
app.use("/api/auth/users", userRoutes);

console.log("🔗 Gắn /api/products");
app.use("/api/auth/products", productRoutes);

console.log("🔗 Gắn /api/cart");
app.use("/api/auth/cart", cartRoutes);

console.log("🔗 Gắn /api/orders");
app.use("/api/auth/orders", orderRoutes);

console.log("🔗 Gắn /api/reviews");
app.use("/api/auth/reviews", reviewRoutes);

console.log("🔗 Gắn /api/ratings");
app.use("/api/auth/ratings", ratingsRoutes);

console.log("🔗 Gắn /api/upload");
app.use("/api/auth/upload", uploadRoutes);

console.log("🔗 Gắn /api/media");
app.use("/api/auth/media", mediaRoutes);

console.log("🔗 Gắn /api/admin");
app.use("/api/auth/admin", adminRoutes);

console.log("🔗 Gắn /api/protected");
app.use("/api/auth/protected", protectedRoutes);

// ✅ Middleware xử lý lỗi cuối cùng
app.use((err, _req, res, _next) => {
  console.error("❌ Lỗi server:", err);
  res.status(500).json({ error: "Lỗi server nội bộ" });
});

// ✅ Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
