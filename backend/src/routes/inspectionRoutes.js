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
    roleAuth('admin', 'security_officer'),
    [
      check('siteId', 'Site ID is required').notEmpty().isInt(),
      check('inspectionTypeId', 'Inspection Type ID is required').notEmpty().isInt(),
      check('inspectorName', 'Inspector Name is required').notEmpty().isString(),
      check('date', 'Date is required').notEmpty().isISO8601(),
      check('formData', 'Form data is required').notEmpty().isObject(),
      check('linkedFaults', 'Linked faults must be an array').optional().isArray(),
    ],
  ],
  inspectionController.createInspection
);

router.get('/', auth, inspectionController.getAllInspections);

router.get('/:id', auth, inspectionController.getInspection);

router.get('/latest/:siteId', auth, inspectionController.getLatestInspection);

router.put(
  '/:id',
  [
    auth,
    roleAuth('admin', 'security_officer'),
    [
      check('siteId', 'Site ID must be an integer').optional().isInt(),
      check('inspectionTypeId', 'Inspection Type ID must be an integer').optional().isInt(),
      check('formData', 'Form data must be an object').optional().isObject(),
      check('status', 'Status is required').optional().isIn(['pending', 'completed', 'requires_action']),
      check('linkedFaults', 'Linked faults must be an array').optional().isArray(),
    ],
  ],
  inspectionController.updateInspection
);

router.delete('/:id', auth, roleAuth('admin'), inspectionController.delete);

// Updated route for getting inspection form structure
router.get(
  '/form-structure/:inspectionTypeId',
  auth,
  roleAuth('admin', 'security_officer'),
  inspectionController.getInspectionFormStructure
);

module.exports = router;