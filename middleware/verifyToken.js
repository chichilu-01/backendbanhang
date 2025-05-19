import jwt from "jsonwebtoken"; // import mặc định

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Thiếu token" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Token không hợp lệ" });
    req.user = decoded;
    next();
  });
};

export default verifyToken;
