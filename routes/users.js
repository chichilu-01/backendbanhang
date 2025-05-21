// routes/users.js
import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// [GET] /users - Lấy danh sách user
router.get("/", (_req, res) => {
  query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Lỗi DB" });
    res.json(results);
  });
});

export default router;
