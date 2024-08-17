const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post(
  '/register',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty()
  ],
  userController.registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  userController.loginUser
);

router.get('/me', auth, userController.getCurrentUser);

router.put(
  '/:id',
  auth,
  [
    check('username', 'Username is required').optional().not().isEmpty(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', 'Role is required').optional().not().isEmpty()
  ],
  userController.updateUser
);

router.delete('/:id', auth, userController.deleteUser);

router.post(
  '/assign-site',
  [
    auth,
    roleAuth('admin'),
    [
      check('userId', 'User ID is required').notEmpty().isInt(),
      check('siteId', 'Site ID is required').notEmpty().isInt(),
    ],
  ],
  userController.assignSiteToUser
);

module.exports = router;