const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/appError');

exports.validateInspection = [
  body('site').notEmpty().withMessage('Site is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('details').isObject().withMessage('Details must be an object'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'requires_action'])
    .withMessage('Invalid status'),
];

exports.validateInspectionId = [
  param('id').isInt().withMessage('Invalid inspection ID'),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  throw new AppError('Validation error', 400, 'BAD_REQUEST').setRequestDetails(req);
};