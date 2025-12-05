import { createTransport } from "nodemailer";

// Cấu hình SMTP Host và API Key của SendGrid
const transporter = createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false, // Không phải SSL, dùng STARTTLS
  requireTLS: true, // Yêu cầu TLS
  auth: {
    // Luôn sử dụng 'apikey' cho user khi dùng API Key
    user: "apikey",

    // Sử dụng biến môi trường mới
    pass: process.env.SENDGRID_API_KEY,
  },
});

export default transporter;
