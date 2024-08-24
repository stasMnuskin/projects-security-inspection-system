const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400, 'BAD_REQUEST').setRequestDetails(req);
  }
  next();
};