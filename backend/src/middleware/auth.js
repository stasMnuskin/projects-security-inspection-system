const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
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
      throw new AppError('Token is not valid', 401, 'INVALID_TOKEN');
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    logger.error('Auth middleware error:', err);
    next(new AppError('Server error', 500, 'SERVER_ERROR'));
  }
};