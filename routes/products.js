import express from "express";
import { query } from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// 📦 LẤY DANH SÁCH SẢN PHẨM
router.get("/", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi truy vấn sản phẩm:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sản phẩm" });
  }
});

// 🔍 GỢI Ý TÊN SẢN PHẨM
router.get("/suggest", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);
  try {
    const rows = await query(
      "SELECT name FROM products WHERE name LIKE ? LIMIT 10",
      [`%${keyword}%`],
    );
    res.json(rows.map((row) => row.name));
  } catch (err) {
    console.error("❌ Lỗi tìm gợi ý:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// 🔒 LƯU BỘ LỌC YÊU THÍCH
router.post("/filters/save", verifyToken, async (req, res) => {
  const { user_id } = req.user;
  const { name, filter } = req.body;
  if (!name || !filter)
    return res.status(400).json({ error: "Thiếu tên hoặc dữ liệu bộ lọc" });

  try {
    await query(
      "INSERT INTO favorite_filters (user_id, name, filter_data) VALUES (?, ?, ?)",
      [user_id, name, JSON.stringify(filter)],
    );
    res.status(201).json({ message: "Đã lưu bộ lọc" });
  } catch (err) {
    console.error("❌ Lỗi lưu bộ lọc:", err);
    res.status(500).json({ error: "Không thể lưu bộ lọc" });
  }
});

// 🔒 LẤY DANH SÁCH BỘ LỌC
router.get("/filters", verifyToken, async (req, res) => {
  const { user_id } = req.user;
  try {
    const rows = await query(
      "SELECT id, name, filter_data FROM favorite_filters WHERE user_id = ? ORDER BY id DESC",
      [user_id],
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        filter: JSON.parse(row.filter_data),
      })),
    );
  } catch (err) {
    console.error("❌ Lỗi lấy bộ lọc:", err);
    res.status(500).json({ error: "Không thể lấy danh sách bộ lọc" });
  }
});

// 📦 LẤY CHI TIẾT SẢN PHẨM
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Lỗi chi tiết sản phẩm:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ✅ THÊM SẢN PHẨM
router.post("/", verifyToken, async (req, res) => {
  console.log("🧾 req.body gửi lên:", req.body);
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Không có quyền" });

  const {
    name,
    price,
    description,
    image_url,
    sizes = [],
    colors = [],
    stock = 0,
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO products (name, price, description, image_url, sizes, colors, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        description,
        image_url,
        JSON.stringify(sizes),
        JSON.stringify(colors),
        stock,
      ],
    );
    res.status(201).json({ id: result.insertId, message: "Đã thêm sản phẩm" });
  } catch (err) {
    console.error("❌ Lỗi thêm sản phẩm:", err);
    res.status(500).json({ error: "Không thể thêm sản phẩm" });
  }
});

// ✅ CẬP NHẬT SẢN PHẨM
router.put("/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Không có quyền" });

  const { id } = req.params;
  const {
    name,
    price,
    description,
    image_url,
    sizes = [],
    colors = [],
    stock = 0,
  } = req.body;

  try {
    await query(
      `UPDATE products SET name=?, price=?, description=?, image_url=?, sizes=?, colors=?, stock=? WHERE id=?`,
      [
        name,
        price,
        description,
        image_url,
        JSON.stringify(sizes),
        JSON.stringify(colors),
        stock,
        id,
      ],
    );
    res.json({ message: "Đã cập nhật sản phẩm" });
  } catch (err) {
    console.error("❌ Lỗi cập nhật sản phẩm:", err);
    res.status(500).json({ error: "Không thể cập nhật sản phẩm" });
  }
});

// ✅ XOÁ SẢN PHẨM
router.delete("/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Không có quyền" });

  const { id } = req.params;
  try {
    await query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Đã xoá sản phẩm" });
  } catch (err) {
    console.error("❌ Lỗi xoá sản phẩm:", err);
    res.status(500).json({ error: "Không thể xoá sản phẩm" });
  }
});

export default router;
