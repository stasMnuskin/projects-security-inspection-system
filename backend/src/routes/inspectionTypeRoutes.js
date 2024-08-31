const express = require('express');
const inspectionTypeController = require('../controllers/inspectionTypeController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post('/', auth, roleAuth('admin'), inspectionTypeController.createInspectionType);
router.get('/', auth, inspectionTypeController.getAllInspectionTypes);
router.get('/:id', auth, inspectionTypeController.getInspectionType);
router.put('/:id', auth, roleAuth('admin'), inspectionTypeController.updateInspectionType);
router.delete('/:id', auth, roleAuth('admin'), inspectionTypeController.deleteInspectionType);
router.get('/site/:siteId', auth, inspectionTypeController.getInspectionTypesBySite);

module.exports = router;