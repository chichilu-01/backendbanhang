import transporter from "./mailClient.js";

const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `Shop Replit <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Mã xác nhận đăng ký",
    html: `
      <p>Xin chào,</p>
      <p>Mã xác nhận đăng ký của bạn là: <b>${code}</b></p>
      <p>Mã có hiệu lực trong 5 phút.</p>
    `,
  });
};

export default sendVerificationEmail;
