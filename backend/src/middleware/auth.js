const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');

module.exports = async (req, res, next) => {
  logger.info('Entering auth middleware');
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
    logger.info(`Token: ${token ? 'Present' : 'Not present'}`);
    if (!token) {
      throw new AppError('No token, authorization denied', 401, 'NO_TOKEN');
    }

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
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    logger.info(`Decoded token: ${JSON.stringify(decoded)}`);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    logger.info(`User found: ${JSON.stringify(user)}`);

    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    next(err);
  }
};