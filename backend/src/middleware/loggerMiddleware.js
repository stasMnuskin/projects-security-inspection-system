const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: req.user ? req.user.id : 'unauthenticated'
  });
  next();
};