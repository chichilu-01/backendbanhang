import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "smtp.gmail.com", // Chỉ định rõ ràng host
  port: 465, // Cổng SSL/TLS
  secure: true, // Bật kết nối bảo mật (SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Phải là App Password
  },
  // Đặt timeout nếu cần, nhưng thường không cần thiết
  // timeout: 10000,
});

export default transporter;
