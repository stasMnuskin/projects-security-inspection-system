const express = require('express');
const inspectionController = require('../controllers/inspectionController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// Get all inspections
router.get('/', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]), 
  inspectionController.getAllInspections
);

// Create a new inspection/drill
router.post('/', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.createInspection
);

// Get latest inspections
router.get('/latest', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]), 
  inspectionController.getLatestInspections
);

// Get latest routine inspection for a site
router.get('/latest-routine/:siteId', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_INSPECTIONS]), 
  inspectionController.getLatestRoutineInspection
);

// Get drill success rate for a site
router.get('/drill-success-rate/:siteId', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_DRILLS]), 
  inspectionController.getDrillSuccessRate
);

// Get inspection form structure
router.get('/form-structure/:siteId/:inspectionTypeId', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.getInspectionFormStructure
);

// Save draft inspection/drill
router.post('/draft', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.saveDraftInspection
);

// Get draft inspection/drill
router.get('/draft/:id', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.getDraftInspection
);

// Delete draft inspection/drill
router.delete('/draft/:id', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.deleteDraftInspection
);

// Get user's draft inspections/drills
router.get('/user/drafts', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.getUserDraftInspections
);

// Get inspections by site
router.get('/site/:siteId', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]), 
  inspectionController.getInspectionsBySite
);

// Get inspection by ID or latest
router.get('/:id', 
  auth, 
  roleAuth([PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]), 
  inspectionController.getLatestInspection
);

// Update an inspection/drill
router.put('/:id', 
  auth, 
  roleAuth([PERMISSIONS.NEW_INSPECTION, PERMISSIONS.NEW_DRILL]), 
  inspectionController.updateInspection
);

// Delete an inspection/drill (admin only)
router.delete('/:id', 
  auth, 
  roleAuth([PERMISSIONS.ADMIN]), 
  inspectionController.deleteInspection
);

module.exports = router;
