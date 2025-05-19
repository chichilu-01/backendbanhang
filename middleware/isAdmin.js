function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Chỉ admin được phép thực hiện" });
  }
  next();
}
export default isAdmin;
