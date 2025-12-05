// 📁 backend/utils/sendVerificationEmail.js

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (to, code) => {
  const senderEmail = process.env.EMAIL_USER;

  const msg = {
    to: to,
    from: `Shop Replit <${senderEmail}>`,
    subject: "🔐 Mã xác nhận đăng ký",
    html: `
            <p>Xin chào,</p>
            <p>Mã xác nhận đăng ký của bạn là: <b>${code}</b></p>
            <p>Mã có hiệu lực trong 5 phút.</p>
        `,
  };

  // Gửi qua API (HTTPS)
  await sgMail.send(msg);
};

export default sendVerificationEmail;
