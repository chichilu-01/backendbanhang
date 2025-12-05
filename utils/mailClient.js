import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "smtp.sendgrid.net",
  port: 2525, // 🔥 THAY ĐỔI: Sử dụng cổng thay thế
  secure: false, // Vẫn dùng STARTTLS
  requireTLS: true,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

export default transporter;
