import resend from "./mailClient.js";

const sendResetCodeEmail = async (to, code) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: "🔐 Mã xác nhận đặt lại mật khẩu",
    html: `
      <div style="font-family: sans-serif;">
        <h2>🔐 Đặt lại mật khẩu</h2>
        <p>Mã xác nhận của bạn là:</p>
        <h1 style="color:#2563eb">${code}</h1>
        <p>Mã có hiệu lực trong <b>5 phút</b>.</p>
        <br/>
        <p>CHICHILU Shop</p>
      </div>
    `,
  });
};

export default sendResetCodeEmail;
