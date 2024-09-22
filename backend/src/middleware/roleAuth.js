const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    logger.info('Entering roleAuth middleware');
    logger.info(`User: ${JSON.stringify(req.user)}`);
    
    // Flatten the allowedRoles array in case it's nested
    const flattenedRoles = allowedRoles.flat();
    
    logger.info(`Checking role. User role: ${req.user.role}, Allowed roles: ${flattenedRoles}`);
    
    if (!req.user) {
      logger.error('User not found in request');
      return next(new AppError('User not found in request', 401, 'USER_NOT_FOUND'));
    }
    
    logger.info(`User role: ${req.user.role}`);
    logger.info(`Allowed roles: ${JSON.stringify(flattenedRoles)}`);
    logger.info(`Is role allowed: ${flattenedRoles.includes(req.user.role)}`);
    
    if (flattenedRoles.includes(req.user.role)) {
      logger.info(`Access granted for user ${req.user.id} with role ${req.user.role}`);
      next();
    } else {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      next(new AppError('Access denied', 403, 'FORBIDDEN'));
    }
  };
};

module.exports = roleAuth;