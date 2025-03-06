const express = require('express');
const { check } = require('express-validator');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// function to validate organization IDs
const validateOrganizationId = (value) => {
  if (!value) return true;
  return Number.isInteger(Number(value));
};

// Get fault types - no special permission needed
router.get('/types', auth, faultController.getFaultTypes);

// Dashboard routes - requires VIEW_FAULTS permission
router.get('/status/open', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getOpenFaults);
router.get('/recurring', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getRecurringFaults);
router.get('/critical', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getCriticalFaults);

// Get all faults with filtering - requires VIEW_FAULTS permission
router.get('/', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getAllFaults);

// Create fault - requires NEW_FAULT permission
router.post('/', [
  auth,
  roleAuth(PERMISSIONS.NEW_FAULT),
  check('siteId').isInt().withMessage('נדרש מזהה אתר תקין'),
  check('type')
    .isIn(['גדר', 'מצלמות', 'תקשורת', 'אחר'])
    .withMessage('סוג תקלה לא חוקי'),
  check('description')
    .if(check('type').equals('אחר'))
    .notEmpty()
    .withMessage('נדרש תיאור לתקלה מסוג אחר'),
  check('severity')
    .optional()
    .isIn(['non_disabling', 'partially_disabling', 'fully_disabling'])
    .withMessage('רמת חומרה לא חוקית'),
  check('isCritical')
    .optional()
    .isBoolean()
    .withMessage('נדרש לציין האם התקלה משביתה'),
  check('isPartiallyDisabling')
    .optional()
    .isBoolean()
    .withMessage('ערך לא חוקי לשדה תקלה משביתה חלקית'),
  validate
], faultController.createFault);

// Update fault status - requires UPDATE_FAULT_STATUS permission
router.put('/:id/status', [
  auth,
  roleAuth(PERMISSIONS.UPDATE_FAULT_STATUS),
  check('status')
    .isIn(['פתוח', 'בטיפול', 'סגור'])
    .withMessage('סטטוס לא חוקי'),
  validate
], faultController.updateFaultStatus);

// Update fault details - requires UPDATE_FAULT_DETAILS permission
router.put('/:id/details', [
  auth,
  roleAuth(PERMISSIONS.UPDATE_FAULT_DETAILS),
  check('technician')
    .optional()
    .notEmpty()
    .withMessage('שם טכנאי לא יכול להיות ריק'),
  check('maintenanceOrganizationId')
    .optional()
    .custom(validateOrganizationId)
    .withMessage('מזהה ארגון אחזקה לא חוקי'),
  check('integratorOrganizationId')
    .optional()
    .custom(validateOrganizationId)
    .withMessage('מזהה ארגון אינטגרציה לא חוקי'),
  validate
], faultController.updateFaultDetails);

// Delete fault - requires admin permission
router.delete('/:id', [
  auth,
  roleAuth(PERMISSIONS.ADMIN),
  check('id').isInt().withMessage('מזהה תקלה לא חוקי'),
  validate
], faultController.deleteFault);

// Get fault by ID - requires VIEW_FAULTS permission
router.get('/:id', [
  auth,
  roleAuth(PERMISSIONS.VIEW_FAULTS),
  check('id').isInt().withMessage('מזהה תקלה לא חוקי'),
  validate
], faultController.getFaultById);

module.exports = router;
