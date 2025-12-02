// 📁 backend/routes/mediaRoutes.js
import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import fs from "fs/promises";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";
import { query } from "../db.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// ⚙️ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================
// ✅ Helper: kiểm tra sản phẩm có ảnh chưa (để set is_main)
// =============================================
async function getIsMainValue(product_id) {
  const rows = await query(
    "SELECT COUNT(*) AS total FROM product_media WHERE product_id = ?",
    [product_id],
  );
  return rows[0].total === 0 ? 1 : 0; // nếu chưa có ảnh → ảnh đầu = main
}

// ✅ Helper: lấy position tiếp theo
async function getNextPosition(product_id) {
  const rows = await query(
    "SELECT COALESCE(MAX(position), 0) AS maxPos FROM product_media WHERE product_id = ?",
    [product_id],
  );
  return (rows[0]?.maxPos || 0) + 1;
}

// =============================================
// ✅ Upload từ URL
// =============================================
router.post("/upload", verifyToken, isAdmin, async (req, res) => {
  try {
    const { url, product_id } = req.body;
    if (!url || !product_id)
      return res.status(400).json({ error: "Thiếu thông tin" });

    const is_main = await getIsMainValue(product_id);
    const position = await getNextPosition(product_id);

    const result = await cloudinary.uploader.upload(url, {
      folder: "products",
    });

    await query(
      "INSERT INTO product_media (product_id, url, type, is_main, position) VALUES (?, ?, 'image', ?, ?)",
      [product_id, result.secure_url, is_main, position],
    );

    // nếu là ảnh chính đầu tiên thì sync lên products.image_url
    if (is_main === 1) {
      await query("UPDATE products SET image_url = ? WHERE id = ?", [
        result.secure_url,
        product_id,
      ]);
    }

    res.json({ message: "✅ Upload thành công", url: result.secure_url });
  } catch (err) {
    console.error("❌ Upload từ URL lỗi:", err);
    res.status(500).json({ error: "Không thể upload ảnh từ URL" });
  }
});

// =============================================
// ✅ Upload từ File
// =============================================
router.post(
  "/upload-file",
  verifyToken,
  isAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      const { product_id } = req.body;
      if (!product_id)
        return res.status(400).json({ error: "Thiếu product_id" });

      const filePath = req.file.path;

      const is_main = await getIsMainValue(product_id);
      const position = await getNextPosition(product_id);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "products",
      });

      await fs.unlink(filePath);

      await query(
        "INSERT INTO product_media (product_id, url, type, is_main, position) VALUES (?, ?, 'image', ?, ?)",
        [product_id, result.secure_url, is_main, position],
      );

      // nếu là ảnh chính đầu tiên thì sync lên products.image_url
      if (is_main === 1) {
        await query("UPDATE products SET image_url = ? WHERE id = ?", [
          result.secure_url,
          product_id,
        ]);
      }

      res.json({
        message: "✅ Upload file thành công",
        url: result.secure_url,
      });
    } catch (err) {
      console.error("❌ Upload từ file lỗi:", err);
      res.status(500).json({ error: "Không thể upload ảnh từ file" });
    }
  },
);

// =============================================
// ✅ Lấy danh sách media theo sản phẩm
//  - Ảnh chính lên đầu
//  - Có thumb_url dùng Cloudinary transform
//  - Order theo position (kéo thả)
// =============================================
router.get("/product/:id", async (req, res) => {
  try {
    const rows = await query(
      `
      SELECT 
        id,
        type,
        url,
        is_main,
        uploaded_at,
        position,
        REPLACE(
          url,
          '/upload/',
          '/upload/c_fill,w_400,h_400,q_auto,f_auto/'
        ) AS thumb_url
      FROM product_media 
      WHERE product_id = ?
      ORDER BY is_main DESC, position ASC, uploaded_at DESC
      `,
      [req.params.id],
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Lỗi lấy media:", err);
    res.status(500).json({ error: "Không lấy được media" });
  }
});

// =============================================
// ✅ Xoá ảnh theo ID
//  - Nếu xoá ảnh chính → tự chọn ảnh khác làm main
//  - Đồng bộ products.image_url
// =============================================
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    // lấy thông tin media trước khi xoá
    const rows = await query(
      "SELECT product_id, is_main FROM product_media WHERE id = ?",
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const { product_id, is_main } = rows[0];

    const result = await query("DELETE FROM product_media WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    // nếu ảnh bị xoá là ảnh chính → chọn ảnh khác làm main
    if (is_main === 1) {
      const [nextMain] = await query(
        `
        SELECT id, url 
        FROM product_media 
        WHERE product_id = ?
        ORDER BY is_main DESC, position ASC, uploaded_at DESC
        LIMIT 1
        `,
        [product_id],
      );

      if (nextMain) {
        await query("UPDATE product_media SET is_main = 1 WHERE id = ?", [
          nextMain.id,
        ]);
        await query("UPDATE products SET image_url = ? WHERE id = ?", [
          nextMain.url,
          product_id,
        ]);
      } else {
        // không còn ảnh nào
        await query("UPDATE products SET image_url = NULL WHERE id = ?", [
          product_id,
        ]);
      }
    }

    res.json({ message: "✅ Đã xoá media" });
  } catch (err) {
    console.error("❌ Lỗi xoá media:", err);
    res.status(500).json({ error: "Không thể xoá media" });
  }
});

// =============================================
// ✅ Đặt ảnh chính (set-main)
//  - Cập nhật products.image_url
// =============================================
router.patch("/:id/set-main", verifyToken, isAdmin, async (req, res) => {
  try {
    const rows = await query(
      "SELECT product_id, url FROM product_media WHERE id = ?",
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy media" });
    }

    const { product_id, url } = rows[0];

    await query("UPDATE product_media SET is_main = 0 WHERE product_id = ?", [
      product_id,
    ]);

    await query("UPDATE product_media SET is_main = 1 WHERE id = ?", [
      req.params.id,
    ]);

    // sync lên products.image_url
    await query("UPDATE products SET image_url = ? WHERE id = ?", [
      url,
      product_id,
    ]);

    res.json({ message: "✅ Đã đặt ảnh chính" });
  } catch (err) {
    console.error("❌ Lỗi đặt ảnh chính:", err);
    res.status(500).json({ error: "Không thể cập nhật ảnh chính" });
  }
});

// =============================================
// ✅ Lưu thứ tự ảnh khi kéo thả
// body: { product_id, media_ids: [id1, id2, ...] }
// =============================================
router.patch("/reorder", verifyToken, isAdmin, async (req, res) => {
  try {
    const { product_id, media_ids } = req.body;

    if (!product_id || !Array.isArray(media_ids)) {
      return res.status(400).json({ error: "Thiếu product_id hoặc media_ids" });
    }

    for (let i = 0; i < media_ids.length; i++) {
      const id = media_ids[i];
      await query(
        "UPDATE product_media SET position = ? WHERE id = ? AND product_id = ?",
        [i + 1, id, product_id],
      );
    }

    res.json({ message: "✅ Đã lưu thứ tự ảnh" });
  } catch (err) {
    console.error("❌ Lỗi reorder media:", err);
    res.status(500).json({ error: "Không thể lưu thứ tự ảnh" });
  }
});

export default router;
