// 📁 backend/index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./db.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import reviewRoutes from "./routes/reviews.js";
import mediaRoutes from "./routes/media.js"; // ✅ mount thủ công

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ✅ CORS cho frontend Vercel
app.use(
  cors({
    origin: "https://frontendbanhang.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// ✅ Route kiểm tra
app.get("/", (_req, res) => res.send("🟢 Backend đang chạy!"));
app.get("/health", (_req, res) => res.send("✅ API OK"));

// ✅ Mount route đặc biệt trước
app.use("/api/products", reviewRoutes);
app.use("/api/media", mediaRoutes); // ✅ mount đúng route media

// 🪄 Auto import các route còn lại (trừ những route đã mount tay)
const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach(async (file) => {
  if (
    file.endsWith(".js") &&
    file !== "reviews.js" &&
    file !== "media.js" // ✅ bỏ qua media.js đã gắn tay
  ) {
    const route = await import(`./routes/${file}`);
    app.use("/api/" + file.replace(".js", ""), route.default);
    console.log("🔗 Gắn /api/" + file.replace(".js", ""));
  }
});

// ✅ Xử lý lỗi chung
app.use((err, _req, res, _next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Lỗi server nội bộ" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
