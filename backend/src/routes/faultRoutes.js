const express = require('express');
const { check, query } = require('express-validator');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const validate = require('../middleware/validate');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// Dashboard routes - requires VIEW_FAULTS permission
router.get('/status/open', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getOpenFaults);
router.get('/recurring', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getRecurringFaults);
router.get('/critical', auth, roleAuth(PERMISSIONS.VIEW_FAULTS), faultController.getCriticalFaults);

// Get all faults with filtering - requires VIEW_FAULTS permission
router.get('/', [
  auth,
  roleAuth(PERMISSIONS.VIEW_FAULTS),
  query('status').optional().isIn(['פתוח', 'בטיפול', 'סגור']).withMessage('סטטוס לא חוקי'),
  query('type').optional().isIn(['גדר', 'מצלמות', 'תקשורת', 'אחר']).withMessage('סוג תקלה לא חוקי'),
  query('startDate').optional().isISO8601().withMessage('תאריך התחלה לא חוקי'),
  query('endDate').optional().isISO8601().withMessage('תאריך סיום לא חוקי'),
  query('site').optional().isString().withMessage('מזהה אתר לא חוקי'),
  query('maintenance').optional().isString().withMessage('מזהה איש אחזקה לא חוקי'),
  query('integrator').optional().isString().withMessage('מזהה אינטגרטור לא חוקי'),
  validate
], faultController.getAllFaults);

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
  check('isCritical')
    .isBoolean()
    .withMessage('נדרש לציין האם התקלה משביתה'),
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
  check('technician').notEmpty().withMessage('נדרש שם טכנאי'),
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
