import { Router } from "express";
const router = Router();
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

// [GET] /products - Lấy danh sách tất cả sản phẩm
router.get("/", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});


// [GET] /products/:id - Chi tiết sản phẩm
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Lỗi DB" });
      if (results.length === 0)
        return res.status(404).json({ error: "Không tìm thấy" });
      res.json(results[0]);
    },
  );
});

// [PUT] /products/:id - Sửa sản phẩm
router.put("/:id", verifyToken, (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  db.query(
    "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?",
    [name, description, price, stock, image_url, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Không sửa được" });
      res.json({ message: "✅ Sửa thành công" });
    },
  );
});

// [DELETE] /products/:id - Xoá sản phẩm
router.delete("/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Không xoá được" });
    res.json({ message: "🗑️ Đã xoá sản phẩm" });
  });
});
export default router;
