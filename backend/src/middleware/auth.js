const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      logger.warn('Authentication attempt without token');
      throw new AppError('No token, authorization denied', 401, 'NO_TOKEN');
    }

    const activeSecrets = getActiveSecrets();
    let decoded;
    let isValid = false;

    for (const secret of activeSecrets) {
      try {
        decoded = jwt.verify(token, secret);
        isValid = true;
        break;
      } catch (err) {
        if (err.name !== 'JsonWebTokenError') {
          logger.error('JWT verification error:', err);
        }
      }
    }

    if (!isValid) {
      logger.warn(`Invalid token: ${token}`);
      throw new AppError('Token is not valid', 401, 'INVALID_TOKEN');
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      logger.warn(`User not found for token: ${token}`);
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      logger.error(`Authentication error: ${err.message}`);
      return next(err);
    }
    logger.error(`Unexpected error during authentication: ${err.message}`);
    next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
};