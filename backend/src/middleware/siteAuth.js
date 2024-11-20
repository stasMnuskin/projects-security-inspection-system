const AppError = require('../utils/appError');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  try {
    const siteId = parseInt(req.params.siteId || req.body.siteId);
    logger.info(`Checking site access for siteId: ${siteId}`);

    if (!siteId) {
      logger.warn('Site ID missing in request');
      throw new AppError('נדרש מזהה אתר', 400, 'BAD_REQUEST');
    }

    // Admin has access to all sites
    if (req.user.role === 'admin') {
      logger.info(`Admin access granted for site ${siteId}`);
      return next();
    }

    // For entrepreneurs, check if they own the site
    if (req.user.role === 'entrepreneur') {
      const hasAccess = req.user.sites?.some(site => site.id === siteId);
      logger.info(`Entrepreneur ${req.user.id} site access check: ${hasAccess}`);
      
      if (hasAccess) {
        return next();
      }
      throw new AppError('אין לך גישה לאתר זה', 403, 'FORBIDDEN');
    }

    // For other roles (security_officer, maintenance, control_center)
    // They can access any site if they have the required permissions
    const requiredPermissions = {
      security_officer: ['inspections', 'new_inspection', 'drills', 'new_drill'],
      maintenance: ['faults'],
      control_center: ['new_fault']
    };

    const rolePermissions = requiredPermissions[req.user.role] || [];
    const hasRequiredPermission = rolePermissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    logger.info(`Role ${req.user.role} permission check for site ${siteId}: ${hasRequiredPermission}`);

    if (hasRequiredPermission) {
      return next();
    }

    throw new AppError('אין לך הרשאות מתאימות לגשת לאתר זה', 403, 'FORBIDDEN');

  } catch (error) {
    logger.error('Site access error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('שגיאה בבדיקת גישה לאתר', 500, 'INTERNAL_ERROR');
  }
};
