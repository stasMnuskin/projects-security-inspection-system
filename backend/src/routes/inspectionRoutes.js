const express = require('express');
const inspectionController = require('../controllers/inspectionController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { validateInspection, validateInspectionId, validate } = require('../middleware/validators');

const router = express.Router();

router.post('/', [auth, roleAuth('admin', 'inspector'), ...validateInspection, validate], inspectionController.createInspection);
router.get('/', [auth, roleAuth('admin', 'inspector', 'technician')], inspectionController.getInspections);
router.get('/:id', [auth, roleAuth('admin', 'inspector', 'technician'), ...validateInspectionId, validate], inspectionController.getInspection);
router.put('/:id', [auth, roleAuth('admin', 'inspector'), ...validateInspectionId, ...validateInspection, validate], inspectionController.updateInspection);
router.delete('/:id', [auth, roleAuth('admin'), ...validateInspectionId, validate], inspectionController.deleteInspection);

module.exports = router;