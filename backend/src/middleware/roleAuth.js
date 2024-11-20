const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { User } = require('../models');

const roleAuth = (requiredPermissions) => {
  // Convert single permission to array for consistent handling
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    logger.info('Entering roleAuth middleware');
    logger.info(`User: ${JSON.stringify(req.user)}`);
    
    if (!req.user) {
      logger.error('User not found in request');
      return next(new AppError('User not found in request', 401, 'USER_NOT_FOUND'));
    }

    // Admin always has access
    if (req.user.role === 'admin') {
      logger.info(`Access granted for admin user ${req.user.id}`);
      return next();
    }

    try {
      // Get current permissions for this role from database
      const rolePermissions = await User.getRolePermissions(req.user.role);
      
      // Check if role has any of the required permissions
      const hasPermission = permissions.some(permission => rolePermissions.includes(permission));
      
      logger.info(`Checking permissions for role ${req.user.role}`);
      logger.info(`Role permissions: ${rolePermissions}`);
      logger.info(`Required permissions: ${permissions}`);
      logger.info(`Has permission: ${hasPermission}`);
      
      if (hasPermission) {
        logger.info(`Access granted for user ${req.user.id} with role ${req.user.role}`);
        next();
      } else {
        logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
        next(new AppError('Access denied', 403, 'FORBIDDEN'));
      }
    } catch (error) {
      logger.error('Error checking permissions:', error);
      next(new AppError('Error checking permissions', 500, 'PERMISSION_CHECK_ERROR'));
    }
  };
};

module.exports = roleAuth;
