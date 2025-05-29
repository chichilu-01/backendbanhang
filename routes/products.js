import express from "express";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

//
// 📦 LẤY DANH SÁCH TẤT CẢ SẢN PHẨM (route chính)
// GET /api/products
//
router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách sản phẩm:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sản phẩm" });
  }
});

//
// 🔍 GỢI Ý TÌM KIẾM SẢN PHẨM
// GET /api/products/suggest?keyword=ao
//
router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  try {
    const [rows] = await db.query(
      "SELECT name FROM products WHERE name LIKE ? LIMIT 10",
      [`%${keyword}%`],
    );
    const suggestions = rows.map((row) => row.name);
    res.json(suggestions);
  } catch (err) {
    console.error("❌ Lỗi khi tìm gợi ý:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

//
// 🔒 LƯU BỘ LỌC YÊU THÍCH
// POST /api/products/filters/save
//
router.post("/filters/save", verifyToken, async (req, res) => {
  const { user_id } = req.user;
  const { name, filter } = req.body;

  if (!name || !filter) {
    return res.status(400).json({ error: "Thiếu tên hoặc dữ liệu bộ lọc" });
  }

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

//
// 🔒 LẤY DANH SÁCH BỘ LỌC ĐÃ LƯU
// GET /api/products/filters
//
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
