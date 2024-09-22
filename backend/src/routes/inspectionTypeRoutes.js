const express = require('express');
const inspectionTypeController = require('../controllers/inspectionTypeController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

// Create a new inspection type (admin only)
router.post('/', auth, roleAuth('admin'), inspectionTypeController.createInspectionType);

// Get all inspection types
router.get('/', auth, inspectionTypeController.getAllInspectionTypes);

// Get a specific inspection type by ID
router.get('/:id', auth, inspectionTypeController.getInspectionType);

// Update an inspection type (admin only)
router.put('/:id', auth, roleAuth('admin'), inspectionTypeController.updateInspectionType);

// Delete an inspection type (admin only)
router.delete('/:id', auth, roleAuth('admin'), inspectionTypeController.deleteInspectionType);

// Get inspection types by site
router.get('/site/:siteId', auth, inspectionTypeController.getInspectionTypesBySite);

// Get the form structure for a specific inspection type
router.get('/:siteId/:inspectionTypeId/form-structure', auth, inspectionTypeController.getInspectionFormStructure);

module.exports = router;