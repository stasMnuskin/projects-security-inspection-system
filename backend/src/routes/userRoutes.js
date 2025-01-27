const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS, ROLES } = require('../constants/roles');

const router = express.Router();

// Authentication (no auth required)
router.post('/login', userController.loginUser);
router.post('/logout', auth, userController.logoutUser);

// Password management (no auth required)
router.post(
  '/forgot-password',
  [
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail()
  ],
  userController.requestPasswordReset
);

router.post(
  '/reset-password',
  [
    check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
    check('password', 'הסיסמה חייבת להכיל לפחות 6 תווים, אותיות ומספרים')
      .isLength({ min: 6 })
      .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/),
    check('token', 'Token is required').not().isEmpty()
  ],
  userController.resetPassword
);

// User profile (auth required)
router.get('/me', auth, userController.getCurrentUser);

// Organizations (auth required)
router.get('/organizations', auth, userController.getOrganizations);

// Users by role (requires appropriate permissions)
router.get('/security-officers', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS, PERMISSIONS.VIEW_FAULTS]), 
  userController.getSecurityOfficers
);

router.get('/maintenance', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_FAULTS]), 
  userController.getMaintenanceStaff
);

router.get('/integrators', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_FAULTS]), 
  userController.getIntegrators
);

// Get users by role
router.get('/by-role',
  auth,
  check('role').isIn(Object.values(ROLES)),
  userController.getUsersByRole
);

// Allow access to entrepreneurs list for site management
router.get('/entrepreneurs', auth, userController.getEntrepreneurs);

// Admin routes (requires admin permission)
router.get('/', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN]), 
  userController.getAllUsers
);

router.put('/:id', [
  auth,
  roleAuth([PERMISSIONS.ADMIN]),
  check('name', 'שם נדרש').not().isEmpty(),
  check('email', 'נא להזין כתובת אימייל תקינה').isEmail(),
  check('role', 'תפקיד נדרש').not().isEmpty()
], userController.updateUserDetails);

router.delete('/:id', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN]), 
  userController.deleteUser
);

// Role permissions management (requires admin permission)
router.get('/roles/permissions/all', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN]), 
  userController.getAllRolePermissions
);

router.get('/roles/:role/permissions', [
  auth,
  roleAuth([PERMISSIONS.ADMIN]),
  check('role').isIn(Object.values(ROLES))
], userController.getRolePermissions);

router.put('/roles/:role/permissions', [
  auth,
  roleAuth([PERMISSIONS.ADMIN]),
  check('role').isIn(Object.values(ROLES)),
  check('permissions', 'הרשאות חייבות להיות מערך').isArray()
], userController.updateRolePermissions);

module.exports = router;
