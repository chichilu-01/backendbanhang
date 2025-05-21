import { Router } from "express";
import { register, login, verifyCode } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/verify-code", verifyCode); // 👈 route xác nhận mã
router.post("/login", login);

export default router;
