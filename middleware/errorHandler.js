
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Server error:", err);

  // Lỗi validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }

  // Lỗi database
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: "Dữ liệu đã tồn tại" });
  }

  // Lỗi mặc định
  res.status(500).json({ error: "Lỗi server nội bộ" });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: "Không tìm thấy endpoint" });
};
