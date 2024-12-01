const express = require('express');
const { check } = require('express-validator');
const registrationController = require('../controllers/registrationController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// Initial registration (admin only)
router.post(
  '/initial',
  [
    auth,
    roleAuth(PERMISSIONS.ADMIN),
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('name', 'שם נדרש').not().isEmpty(),
    check('role', 'יש לבחור תפקיד')
      .isIn(['admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center']),
    // Validate organizationName only for integrator and maintenance roles
    check('organizationName')
      .custom((value, { req }) => {
        if (['integrator', 'maintenance'].includes(req.body.role)) {
          if (!value) {
            throw new Error('נדרש שם ארגון למשתמש מסוג אינטגרטור או אחזקה');
          }
          if (value.trim().length === 0) {
            throw new Error('שם הארגון לא יכול להיות ריק');
          }
        }
        return true;
      })
  ],
  registrationController.generateRegistrationLink
);

// Validate registration token (no auth required - public route)
router.get(
  '/validate',
  [
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('token', 'קישור הרשמה לא תקין').not().isEmpty()
  ],
  registrationController.validateRegistrationToken
);

// Complete registration (no auth required - uses registration token)
router.post(
  '/complete',
  [
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('password', 'הסיסמה חייבת להכיל לפחות 6 תווים, כולל אותיות באנגלית ומספרים')
      .isLength({ min: 6 })
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/),
    check('token', 'קישור הרשמה לא תקין').not().isEmpty()
  ],
  registrationController.registerUser
);

// Get organizations for registration (no auth required)
router.get(
  '/organizations',
  [
    check('type')
      .isIn(['integrator', 'maintenance'])
      .withMessage('סוג ארגון לא תקין')
  ],
  registrationController.getOrganizations
);

// Get organizations for admin (auth required)
router.get(
  '/organizations/admin',
  auth,
  roleAuth(PERMISSIONS.ADMIN),
  registrationController.getOrganizations
);

module.exports = router;
