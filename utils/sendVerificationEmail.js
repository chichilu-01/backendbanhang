import resend from "./mailClient.js";

const sendVerificationEmail = async (to, code) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: "📩 Mã xác nhận đăng ký tài khoản",
    html: `
      <div style="font-family: sans-serif;">
        <h2>📩 Xác nhận đăng ký</h2>
        <p>Mã xác nhận của bạn là:</p>
        <h1 style="color:#16a34a">${code}</h1>
        <p>Mã có hiệu lực trong <b>5 phút</b>.</p>
        <br/>
        <p>CHICHILU Shop</p>
      </div>
    `,
  });
};

export default sendVerificationEmail;
