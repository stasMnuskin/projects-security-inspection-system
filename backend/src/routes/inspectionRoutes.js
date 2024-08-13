const express = require('express');
const { check } = require('express-validator');
const inspectionController = require('../controllers/inspectionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  [
    auth,
    [
      check('site', 'Site is required').not().isEmpty(),
      check('type', 'Type is required').not().isEmpty(),
      check('details', 'Details are required').not().isEmpty(),
    ],
  ],
  inspectionController.createInspection
);

router.get('/', auth, inspectionController.getInspections);
router.get('/:id', auth, inspectionController.getInspection);
router.put(
  '/:id',
  [
    auth,
    [
      check('site', 'Site is required').not().isEmpty(),
      check('type', 'Type is required').not().isEmpty(),
      check('details', 'Details are required').not().isEmpty(),
      check('status', 'Status is required').isIn(['pending', 'completed', 'requires_action']),
    ],
  ],
  inspectionController.updateInspection
);
router.delete('/:id', auth, inspectionController.deleteInspection);

module.exports = router;