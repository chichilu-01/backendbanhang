import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// import các route khác
import orderRoutes from "./routes/orders.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import protectedRoutes from "./routes/protected.js";
import adminRoutes from "./routes/admin.js";
import cartRoutes from "./routes/cart.js";
import reviewRoutes from "./routes/reviews.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js"; // mới
import ratingsRouter from "./routes/ratings.js";
import "./db.js"; // kết nối MySQL

dotenv.config();

const app = express();

// CORS cho frontend Vercel, bao gồm PATCH, DELETE, OPTIONS
app.use(
  cors({
    origin: "https://frontendbanhang.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());

// static folder cho uploads (nếu có dùng local)
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.send("🟢 Backend đang chạy!"));
app.get("/health", (_req, res) => res.send("✅ API OK"));

// các route cũ
app.use("/api/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/protected", protectedRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/reviews", reviewRoutes);
app.use("/ratings", ratingsRouter);
// 👉 Gắn uploadRoutes **đúng** vào /api/upload
app.use("/api/upload", uploadRoutes);

// error handler
app.use((err, _req, res, _next) => {
  console.error("❌ Lỗi server:", err);
  res.status(500).json({ error: "Lỗi server nội bộ" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
