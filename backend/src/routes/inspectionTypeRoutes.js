const express = require('express');
const router = express.Router();
const inspectionTypeController = require('../controllers/inspectionTypeController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../constants/roles');

router.use(auth);

// Get all inspection types
router.get('/', inspectionTypeController.getAllInspectionTypes);

// Get inspection types for a specific site
router.get('/site/:siteId', inspectionTypeController.getInspectionTypesBySite);

// Get enabled fields for a specific type and site
router.get('/site/:siteId/enabled-fields', inspectionTypeController.getEnabledFields);

// Get field types
router.get('/field-types', inspectionTypeController.getFieldTypes);

// Get available fields for an inspection type
router.get('/:id/available-fields', inspectionTypeController.getAvailableFields);

// Get specific inspection type
router.get('/:id', inspectionTypeController.getInspectionType);

// Create new inspection type (admin only)
router.post('/',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.createInspectionType
);

// Update inspection type (admin only)
router.put('/:id',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.updateInspectionType
);

// Delete inspection type (admin only)
router.delete('/:id',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.deleteInspectionType
);

// Update field status
router.patch('/:id/fields/:fieldId',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.updateFieldStatus
);

// Add custom field
router.post('/:id/fields',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.addCustomField
);

// Delete field
router.delete('/:id/fields/:fieldId',
  roleAuth([PERMISSIONS.ADMIN]),
  inspectionTypeController.deleteField
);

module.exports = router;
