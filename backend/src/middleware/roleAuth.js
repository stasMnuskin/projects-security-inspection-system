const AppError = require('../utils/appError');

const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not found in request', 401, 'USER_NOT_FOUND'));
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      next(new AppError('Access denied', 403, 'FORBIDDEN'));
    }
  };
};

module.exports = roleAuth;