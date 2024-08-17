const express = require('express');
const { check } = require('express-validator');
const inspectionController = require('../controllers/inspectionController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post(
  '/',
  [
    auth,
    roleAuth('admin', 'inspector'),
    [
      check('entrepreneurId', 'Entrepreneur ID is required').notEmpty().isInt(),
      check('siteId', 'Site ID is required').notEmpty().isInt(),
      check('inspectionTypeId', 'Inspection Type ID is required').notEmpty().isInt(),
      check('details', 'Details are required').notEmpty().isObject(),
    ],
  ],
  inspectionController.createInspection
);

router.get('/', auth, inspectionController.getAllInspections);

router.get('/:id', auth, inspectionController.getInspection);

router.put(
  '/:id',
  [
    auth,
    roleAuth('admin', 'inspector'),
    [
      check('entrepreneurId', 'Entrepreneur ID is required').optional().isInt(),
      check('siteId', 'Site ID is required').optional().isInt(),
      check('inspectionTypeId', 'Inspection Type ID is required').optional().isInt(),
      check('details', 'Details are required').optional().isObject(),
      check('status', 'Status is required').optional().isIn(['pending', 'completed', 'requires_action']),
    ],
  ],
  inspectionController.updateInspection
);

router.delete('/:id', auth, roleAuth('admin'), inspectionController.delete);

module.exports = router;