const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

// Register a new user
router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['security_officer', 'admin'])
  ],
  userController.registerUser
);

// Login user
router.post('/login', userController.loginUser);

// Logout user
router.post('/logout', auth, userController.logoutUser);

// Get current user
router.get('/me', auth, userController.getCurrentUser);

// Update user profile
router.put(
  '/update',
  [
    auth,
    check('username', 'Username is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 })
  ],
  userController.updateUser
);

// Get all users (admin and security_officer)
router.get('/', auth, roleAuth('admin', 'security_officer'), userController.getAllUsers);

// Delete user (admin only)
router.delete('/:id', auth, roleAuth('admin', 'inspector'), userController.deleteUser);

// Change user role (admin only)
router.put(
  '/:id/role',
  auth, roleAuth('admin', 'inspector'), userController.changeUserRole
);

router.post('/change-password', auth, userController.changePassword);

// route for checking users and resetting sequence (admin only)
router.post('/check-and-reset', auth, roleAuth('admin'), userController.checkUsersAndResetSequence);

module.exports = router;