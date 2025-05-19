import { Router } from "express";
const router = Router();
import verifyToken from "../middleware/verifyToken.js";

router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: `Xin chào ${req.user.name}`,
    user: req.user,
  });
});

router.get("/admin", verifyToken, (_req, res) => {
  // Ở đây có thể kiểm tra thêm quyền admin
  res.send("Trang quản trị - chỉ người đăng nhập mới vào được");
});

export default router;
