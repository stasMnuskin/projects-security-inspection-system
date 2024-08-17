const express = require('express');
const { check, body } = require('express-validator');
// const inspectionTypeController = require('../controllers/inspectionTypeController');
const inspectionController = require('../controllers/inspectionController');
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
      check('formStructure', 'Form structure is required').isArray(),
      body('formStructure.*.name', 'Field name is required').not().isEmpty(),
      body('formStructure.*.type', 'Field type is required').isIn(['text', 'number', 'boolean', 'select', 'multiselect', 'date']),
      body('formStructure.*.options', 'Options are required for select and multiselect').custom((options, { req }) => {
        const field = req.body.formStructure.find(f => f.name === req.body.formStructure[req.body.formStructure.indexOf(req.body.formStructure.find(f => f.options === options))].name);
        if (['select', 'multiselect'].includes(field.type)) {
          return Array.isArray(options);
        }
        return true;
      }),
      check('frequency', 'Frequency is required').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annually']),
      check('siteId', 'Site ID is required').isInt(),
    ],
  ],
  inspectionController.createInspection
);

router.get('/', auth, inspectionController.getAllInspectionTypes);
router.get('/:id', auth, inspectionController.getInspectionType);

router.put(
  '/:id',
  [
    auth,
    roleAuth('admin'),
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('formStructure', 'Form structure is required').optional().not().isEmpty(),
      check('frequency', 'Frequency is required').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annually']),
      check('siteId', 'Site ID is required').optional().isInt(),
    ],
  ],
  inspectionController.updateInspection
);

router.delete('/:id', auth, roleAuth('admin'), inspectionController.delete);

module.exports = router;