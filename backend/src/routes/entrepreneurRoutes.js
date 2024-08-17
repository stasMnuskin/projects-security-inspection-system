const express = require('express');
const { check } = require('express-validator');
const entrepreneurController = require('../controllers/entrepreneurController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post(
  '/',
  [
    auth,
    roleAuth('admin'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('contactPerson', 'Contact person is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone number is required').not().isEmpty(),
    ],
  ],
  entrepreneurController.createEntrepreneur
);

router.get('/', auth, entrepreneurController.getAllEntrepreneurs);
router.get('/:id', auth, entrepreneurController.getEntrepreneur);

router.put(
  '/:id',
  [
    auth,
    roleAuth('admin'),
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('contactPerson', 'Contact person is required').optional().not().isEmpty(),
      check('email', 'Please include a valid email').optional().isEmail(),
      check('phone', 'Phone number is required').optional().not().isEmpty(),
    ],
  ],
  entrepreneurController.updateEntrepreneur
);

router.delete('/:id', auth, roleAuth('admin'), entrepreneurController.deleteEntrepreneur);

module.exports = router;