
import { body, validationResult } from "express-validator";

export const validateRegistration = [
  body("name").trim().isLength({ min: 2 }).withMessage("Tên phải có ít nhất 2 ký tự"),
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("role").optional().isIn(["user", "admin"]).withMessage("Role không hợp lệ")
];

export const validateLogin = [
  body("email").isEmail().withMessage("Email không hợp lệ"),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống")
];

export const validateReview = [
  body("product_id").isInt({ min: 1 }).withMessage("Product ID không hợp lệ"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating phải từ 1-5"),
  body("comment").trim().isLength({ min: 1 }).withMessage("Comment không được để trống")
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: "Dữ liệu không hợp lệ", 
      details: errors.array() 
    });
  }
  next();
};
