import { createTransport } from "nodemailer";

const sendVerificationEmail = async (to, code) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Shop Replit <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Mã xác nhận đăng ký",
    html: `<p>Xin chào,</p>
           <p>Mã xác nhận đăng ký của bạn là: <b>${code}</b></p>
           <p>Mã có hiệu lực trong 5 phút.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendVerificationEmail;
