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
    check('firstName', 'שם פרטי נדרש').not().isEmpty(),
    check('organization', 'ארגון נדרש').not().isEmpty(),
    check('role', 'יש לבחור תפקיד')
      .isIn(['admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'])
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
    check('firstName', 'שם פרטי נדרש').not().isEmpty(),
    check('lastName', 'שם משפחה נדרש').not().isEmpty(),
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('password', 'הסיסמה חייבת להכיל לפחות 6 תווים, כולל אותיות באנגלית ומספרים')
      .isLength({ min: 6 })
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/),
    check('token', 'קישור הרשמה לא תקין').not().isEmpty()
  ],
  registrationController.registerUser
);

// Get organizations for autocomplete (auth required)
router.get(
  '/organizations',
  auth,
  registrationController.getOrganizations
);

module.exports = router;
