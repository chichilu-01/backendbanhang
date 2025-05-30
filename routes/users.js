import { Router } from "express";
import { query } from "../db.js";

const router = Router();

/**
 * [GET] /users - Lấy danh sách user
 */
router.get("/", async (_req, res) => {
  try {
    const results = await query("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    console.error("❌ Lỗi lấy users:", err);
    res.status(500).json({ error: "Lỗi DB" });
  }
});

export default router;
