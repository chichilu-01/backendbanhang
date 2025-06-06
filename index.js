import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./db.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import reviewRoutes from "./routes/reviews.js"; // ✅ mount riêng cho reviews

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(
  cors({
    origin: "https://frontendbanhang.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.send("🟢 Backend đang chạy!"));
app.get("/health", (_req, res) => res.send("✅ API OK"));

// ✅ Mount review routes tại /api/products (trước auto import)
app.use("/api/products", reviewRoutes); // → cho phép gọi POST/GET /api/products/:id/reviews

// 🪄 Auto import các route còn lại (trừ reviews.js đã xử lý riêng)
const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach(async (file) => {
  if (file.endsWith(".js") && file !== "reviews.js") {
    const route = await import(`./routes/${file}`);
    app.use("/api/" + file.replace(".js", ""), route.default);
    console.log("🔗 Gắn /api/" + file.replace(".js", ""));
  }
});

app.use((err, _req, res, _next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Lỗi server nội bộ" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
