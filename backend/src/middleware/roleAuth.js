const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    logger.info(`Checking role. User role: ${req.user.role}, Allowed roles: ${allowedRoles}`);
    if (!req.user) {
      return next(new AppError('User not found in request', 401, 'USER_NOT_FOUND'));
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      next(new AppError('Access denied', 403, 'FORBIDDEN'));
    }
  };
};

module.exports = roleAuth;