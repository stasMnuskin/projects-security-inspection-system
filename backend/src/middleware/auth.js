const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('No token, authorization denied', 401, 'NO_TOKEN');
    }

    const secrets = getActiveSecrets();
    let decoded;
    for (const secret of secrets) {
      try {
        decoded = jwt.verify(token, secret);
        break;
      } catch (err) {
        continue;
      }
    }

    if (!decoded) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    req.user = user;
    logger.info(`User ${user.id} authenticated successfully`);
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    next(err);
  }
};