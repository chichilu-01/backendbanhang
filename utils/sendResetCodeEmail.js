// 📁 backend/utils/sendResetCodeEmail.js

import sgMail from "@sendgrid/mail";

// Thiết lập API Key (sử dụng biến môi trường SENDGRID_API_KEY)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendResetCodeEmail = async (to, code) => {
  // SENDER phải là email đã được Verified: phoenix**om274@gmail.com
  const senderEmail = process.env.EMAIL_USER;

  const msg = {
    to: to,
    // Dùng tên đã được Verified
    from: `CHICHILU Shop <${senderEmail}>`,
    subject: "🔐 Mã xác nhận đặt lại mật khẩu",
    html: `<p>Mã đặt lại mật khẩu của bạn là: <b>${code}</b></p><p>Có hiệu lực trong 5 phút.</p>`,
  };

  // Gửi qua API (HTTPS)
  await sgMail.send(msg);
};

export default sendResetCodeEmail;
