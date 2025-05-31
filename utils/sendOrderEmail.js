import transporter from "./mailClient.js";

const sendOrderEmail = async (to, orderId, total, items) => {
  const itemHtml = items
    .map(
      (item) =>
        `<li>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toLocaleString()} VND</li>`,
    )
    .join("");

  await transporter.sendMail({
    from: `Shop Replit <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ Xác nhận đơn hàng #${orderId}`,
    html: `<h3>Cảm ơn bạn đã đặt hàng!</h3>
           <p>Đơn hàng #${orderId} đã được tạo thành công.</p>
           <p><strong>Chi tiết đơn hàng:</strong></p>
           <ul>${itemHtml}</ul>
           <p><strong>Tổng tiền:</strong> ${total.toLocaleString()} VND</p>`,
  });
};

export default sendOrderEmail;
