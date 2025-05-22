import express from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    const folder = isVideo ? 'uploads/videos' : 'uploads/images';
    fs.mkdirSync(folder, { recursive: true }); // tạo thư mục nếu chưa có
    cb(null, folder);
  },
  filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  const { product_id } = req.body;
  const file = req.file;

  if (!file || !product_id) {
    return res.status(400).json({ error: 'Thiếu file hoặc product_id' });
  }

  const type = file.mimetype.startsWith('video/') ? 'video' : 'image';
  const url = `/uploads/${type}s/${file.filename}`;

  try {
    db.query(
          'INSERT INTO product_media (product_id, type, url) VALUES (?, ?, ?)',
          [product_id, type, url]
      );
    res.json({ message: 'Upload thành công', url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi lưu DB' });
  }
});

export default router;
