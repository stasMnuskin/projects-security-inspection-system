const jwt = require('jsonwebtoken');
const { User, Site } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');

module.exports = async (req, res, next) => {
  logger.info('Entering auth middleware');
  try {
    // Get token from various possible sources
    const token = req.cookies.token || 
                 req.header('Authorization')?.replace('Bearer ', '') || 
                 req.header('x-auth-token');

    logger.info(`Token: ${token ? 'Present' : 'Not present'}`);
    if (!token) {
      throw new AppError('נדרשת הזדהות למערכת', 401, 'NO_TOKEN');
    }

    // Verify token with active secrets
    const secrets = getActiveSecrets();
    let decoded;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret);
        logger.info('Token verified successfully');
        break;
      } catch (err) {
        logger.warn(`Token verification failed with secret: ${secret.substring(0, 10)}...`);
        continue;
      }
    }

    if (!decoded) {
      throw new AppError('פג תוקף ההזדהות, נא להתחבר מחדש', 401, 'INVALID_TOKEN');
    }

    logger.info(`Decoded token: ${JSON.stringify(decoded)}`);

    // Find user with their sites if they're an entrepreneur
    const include = [];
    if (decoded.role === 'entrepreneur') {
      include.push({
        model: Site,
        as: 'sites',
        attributes: ['id', 'name', 'type']
      });
    }

    const user = await User.findByPk(decoded.id, {
      include
    });

    if (!user) {
      throw new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND');
    }

    // Check if registration is incomplete (no password set)
    if (!user.password) {
      throw new AppError('נדרש להשלים את תהליך ההרשמה', 403, 'REGISTRATION_INCOMPLETE');
    }

    // Check if password change is required
    if (user.passwordChangeRequired) {
      // Allow only password change endpoint
      if (!req.path.includes('/change-password')) {
        throw new AppError('נדרש שינוי סיסמה', 403, 'PASSWORD_CHANGE_REQUIRED');
      }
    }

    // Add user to request
    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);

    // Check token expiration and refresh if needed
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeToExpire = tokenExp - now;
    const refreshThreshold = 15 * 60 * 1000; // 15 minutes

    if (timeToExpire < refreshThreshold) {
      logger.info('Token approaching expiration, refreshing');
      const newToken = jwt.sign(
        { 
          id: user.id,
          role: user.role,
          permissions: user.permissions
        },
        secrets[0],
        { expiresIn: '1d' }
      );

      // Use HTTPS if API_URL starts with https
      const isSecure = process.env.API_URL.startsWith('https');
      
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
      res.setHeader('x-auth-token', newToken);
    }

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    next(err);
  }
};
