const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
  const siteId = parseInt(req.params.siteId || req.body.siteId);

  if (!siteId) {
    throw new AppError('Site ID is required', 400, 'BAD_REQUEST').setRequestDetails(req);
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const hasAccess = req.user.Sites.some(site => site.id === siteId);

  if (hasAccess) {
    next();
  } else {
    throw new AppError('You dont have access to this site', 403, 'FORBIDDEN').setRequestDetails(req);
  }
};