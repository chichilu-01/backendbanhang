// 📁 backend/routes/authRoutes.js
import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const router = Router();

router.post("/register", auth.register);
router.post("/verify-code", auth.verifyCode);
router.post("/login", auth.login);

router.post("/forgot-password", auth.forgotPassword);
router.post("/verify-reset-code", auth.verifyResetCode);
router.post("/reset-password", auth.resetPassword);

router.put("/profile", verifyToken, auth.updateProfile);
router.put("/change-password", verifyToken, auth.changePassword);

export default router;
