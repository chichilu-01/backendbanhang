import { createTransport } from "nodemailer";

const sendResetCodeEmail = async (to, code) => {
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
    subject: "🔐 Mã xác nhận đặt lại mật khẩu",
    html: `<p>Mã đặt lại mật khẩu của bạn là: <b>${code}</b></p><p>Có hiệu lực trong 5 phút.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendResetCodeEmail;
