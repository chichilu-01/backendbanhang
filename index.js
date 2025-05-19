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
import "./db.js"; // chỉ cần gọi để mở kết nối

dotenv.config(); // ✅ dùng import, không require

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("🟢 Backend đang chạy trên Replit!"));

app.use("/orders", orderRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/protected", protectedRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/reviews", reviewRoutes);

// Middleware xử lý lỗi
app.use((err, _req, res, _next) => {
  console.error("❌ Lỗi:", err.stack);
  res.status(500).json({ error: "Lỗi server" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại cổng ${PORT}`));
