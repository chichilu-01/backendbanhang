import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", auth.register);
router.post("/verify-code", auth.verifyCode);
router.post("/login", auth.login);
router.post("/forgot-password", auth.forgotPassword);
router.post("/verify-reset-code", auth.verifyResetCode);
router.post("/reset-password", auth.resetPassword);

export default router;
