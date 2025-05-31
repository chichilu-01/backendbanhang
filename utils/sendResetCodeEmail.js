import transporter from "./mailClient.js";

const sendResetCodeEmail = async (to, code) => {
  await transporter.sendMail({
    from: `Shop Replit <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Mã xác nhận đặt lại mật khẩu",
    html: `<p>Mã đặt lại mật khẩu của bạn là: <b>${code}</b></p><p>Có hiệu lực trong 5 phút.</p>`,
  });
};

export default sendResetCodeEmail;
