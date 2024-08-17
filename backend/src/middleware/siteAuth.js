module.exports = (req, res, next) => {
  const siteId = parseInt(req.params.siteId || req.body.siteId);

  if (!siteId) {
    return res.status(400).json({ message: "Site ID is required" });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const hasAccess = req.user.Sites.some(site => site.id === siteId);

  if (hasAccess) {
    next();
  } else {
    res.status(403).json({ message: "You don't have access to this site" });
  }
};