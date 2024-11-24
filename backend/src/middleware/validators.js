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

exports.validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('name')
    .notEmpty()
    .withMessage('שם נדרש')
    .trim()
    .isLength({ min: 2 })
    .withMessage('שם חייב להכיל לפחות 2 תווים'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('סיסמה חייבת להכיל לפחות 6 תווים'),
  body('role')
    .optional()
    .isIn(['admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'])
    .withMessage('תפקיד לא תקין'),
  body('organizationName')
    .optional()
    .trim()
];

exports.validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('שם חייב להכיל לפחות 2 תווים'),
  body('role')
    .optional()
    .isIn(['admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'])
    .withMessage('תפקיד לא תקין'),
  body('organization')
    .optional()
    .trim()
];

exports.validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('סיסמה חייבת להכיל לפחות 6 תווים'),
  body('token')
    .notEmpty()
    .withMessage('טוקן נדרש')
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  throw new AppError('Validation error', 400, 'BAD_REQUEST').setRequestDetails(req);
};
