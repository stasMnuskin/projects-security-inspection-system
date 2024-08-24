const AppError = require('../utils/appError');

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('No user information found', 403, 'FORBIDDEN').setRequestDetails(req);
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      throw new AppError('Access denied', 403, 'FORBIDDEN').setRequestDetails(req);
    }
  };
};