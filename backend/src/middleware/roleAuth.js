module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "No user information found" });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  };
};