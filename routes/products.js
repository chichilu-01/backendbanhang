import express from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

// Gợi ý tìm kiếm sản phẩm
router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  try {
    const [rows] = await db.query(
      "SELECT name FROM products WHERE name LIKE ? LIMIT 10",
      [`%${keyword}%`],
    );
    res.json(rows.map((row) => row.name));
  } catch (err) {
    console.error("❌ Lỗi khi tìm gợi ý:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// 🔒 Lưu bộ lọc yêu thích (POST /products/filters/save)
router.post("/filters/save", verifyToken, async (req, res) => {
  const { user_id } = req.user;
  const { name, filter } = req.body;
  if (!name || !filter)
    return res.status(400).json({ error: "Thiếu tên hoặc dữ liệu bộ lọc" });

  try {
    await db.query(
      "INSERT INTO favorite_filters (user_id, name, filter_data) VALUES (?, ?, ?)",
      [user_id, name, JSON.stringify(filter)],
    );
    res.status(201).json({ message: "Đã lưu bộ lọc" });
  } catch (err) {
    console.error("❌ Lỗi lưu bộ lọc:", err);
    res.status(500).json({ error: "Không thể lưu bộ lọc" });
  }
});

// 🔒 Lấy các bộ lọc đã lưu (GET /products/filters)
router.get("/filters", verifyToken, async (req, res) => {
  const { user_id } = req.user;
  try {
    const [rows] = await db.query(
      "SELECT id, name, filter_data FROM favorite_filters WHERE user_id = ? ORDER BY id DESC",
      [user_id],
    );
    const filters = rows.map((row) => ({
      id: row.id,
      name: row.name,
      filter: JSON.parse(row.filter_data),
    }));
    res.json(filters);
  } catch (err) {
    console.error("❌ Lỗi lấy bộ lọc đã lưu:", err);
    res.status(500).json({ error: "Không thể lấy danh sách bộ lọc" });
  }
});

export default router;
