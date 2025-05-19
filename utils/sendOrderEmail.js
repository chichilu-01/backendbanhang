import { createTransport } from "nodemailer";

const sendOrderEmail = async (to, orderId, total, items) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const itemHtml = items
    .map(
      (item) => `
        <li>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toLocaleString()} VND</li>
      `,
    )
    .join("");

  const mailOptions = {
    from: `Shop Replit <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Xác nhận đơn hàng #${orderId}`,
    html: `<h3>Cảm ơn bạn đã đặt hàng!</h3>
           <p>Đơn hàng #${orderId} đã được tạo thành công.</p>
           <p><strong>Chi tiết đơn hàng:</strong></p>
           <ul>${itemHtml}</ul>
           <p><strong>Tổng tiền:</strong> ${total.toLocaleString()} VND</p>`,
  };

  await transporter.sendMail(mailOptions);
};

export default sendOrderEmail; // ✅ Dòng này phải như vậy
