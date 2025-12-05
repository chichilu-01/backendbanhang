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
import mediaRoutes from "./routes/media.js"; // ✅ mount tay media
//import productRoutes from "./routes/products.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ✅ CORS phải đặt TRƯỚC express.json() và route
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

// ✅ Gắn tay những route quan trọng
app.use("/api/products", reviewRoutes);
app.use("/api/media", mediaRoutes);
//app.use("/api/products", productRoutes); // ✅ đúng

// 🪄 Auto import các route còn lại (không lặp lại reviews/media)
const routesPath = path.join(__dirname, "routes");
for (const file of fs.readdirSync(routesPath)) {
  if (file.endsWith(".js") && !["reviews.js", "media.js"].includes(file)) {
    const route = await import(`./routes/${file}`);
    app.use("/api/" + file.replace(".js", ""), route.default);
    console.log("🔗 Gắn /api/" + file.replace(".js", ""));
  }
}

// ✅ Xử lý lỗi chung
app.use((err, _req, res, _next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Lỗi server nội bộ" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
