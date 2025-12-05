// 📁 backend/utils/sendOrderEmail.js

// Loại bỏ: import transporter from "./mailClient.js";
import sgMail from "@sendgrid/mail"; // 👈 Dùng thư viện API

// Thiết lập API Key (chỉ cần thiết lập 1 lần, nhưng an toàn khi đặt ở đây)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendOrderEmail = async (to, orderId, total, items) => {
  const itemHtml = items
    .map(
      (item) =>
        `<li>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toLocaleString()} VND</li>`,
    )
    .join("");

  const senderEmail = process.env.EMAIL_USER;

  // 1. Định nghĩa nội dung email cho SendGrid API
  const msg = {
    from: `Shop Replit <${senderEmail}>`, // 👈 Sử dụng email đã Verified
    to: to,
    subject: `✅ Xác nhận đơn hàng #${orderId}`,
    html: `<h3>Cảm ơn bạn đã đặt hàng!</h3>
<p>Đơn hàng #${orderId} đã được tạo thành công.</p>
<p><strong>Chi tiết đơn hàng:</strong></p>
<ul>${itemHtml}</ul>
<p><strong>Tổng tiền:</strong> ${total.toLocaleString()} VND</p>`,
  };

  // 2. Gửi email qua API (HTTPS)
  await sgMail.send(msg);
};

export default sendOrderEmail;
