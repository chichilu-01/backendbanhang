import { Router } from "express";
import { register, login, verifyCode } from "../controllers/auth.controller.js";
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/verify-code", verifyCode); // 👈 route xác nhận mã
router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
