const express = require('express');
const { check } = require('express-validator');
const siteController = require('../controllers/siteController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// Helper function to validate organization IDs
const validateOrganizationId = (value) => {
  if (!value) return true;
  return Number.isInteger(Number(value));
};

// Helper function to validate user IDs array
const validateUserIds = (value) => {
  if (!value) return true;
  if (!Array.isArray(value)) return false;
  return value.every(id => Number.isInteger(Number(id)));
};

// All routes require authentication
router.use(auth);

// Create site (admin only)
router.post('/',
  roleAuth(PERMISSIONS.ADMIN),
  [
    check('name')
      .notEmpty()
      .withMessage('שם האתר נדרש'),
    check('type')
      .isIn(['radar', 'inductive_fence'])
      .withMessage('סוג אתר לא תקין'),
    check('entrepreneurId')
      .isInt()
      .withMessage('מזהה יזם לא תקין'),
    check('integratorOrganizationIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי ארגוני אינטגרציה לא תקינים'),
    check('maintenanceOrganizationIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי ארגוני אחזקה לא תקינים'),
    check('controlCenterUserId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('מזהה איש מוקד לא תקין'),
    check('notificationRecipientIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי משתמשים לא תקינים'),
    check('customFields')
      .optional()
      .isArray()
      .withMessage('שדות מותאמים אישית חייבים להיות מערך')
      .custom((fields) => {
        if (fields) {
          for (const field of fields) {
            if (!field.name || !field.value) {
              throw new Error('כל שדה מותאם אישית חייב להכיל שם וערך');
            }
          }
        }
        return true;
      })
  ],
  siteController.createSite
);

// Get all sites (users who can view faults, inspections, or drills)
router.get('/',
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_FAULTS, PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]),
  siteController.getAllSites
);

// Get sites by entrepreneur
router.get('/entrepreneur/:entrepreneurId',
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_FAULTS, PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]),
  siteController.getSitesByEntrepreneur
);

// Get specific site
router.get('/:id',
  roleAuth([PERMISSIONS.ADMIN, PERMISSIONS.VIEW_FAULTS, PERMISSIONS.VIEW_INSPECTIONS, PERMISSIONS.VIEW_DRILLS]),
  siteController.getSite
);

// Update site (admin only)
router.put('/:id',
  roleAuth(PERMISSIONS.ADMIN),
  [
    check('name')
      .optional()
      .notEmpty()
      .withMessage('שם האתר לא יכול להיות ריק'),
    check('type')
      .optional()
      .isIn(['radar', 'inductive_fence'])
      .withMessage('סוג אתר לא תקין'),
    check('entrepreneurId')
      .optional()
      .isInt()
      .withMessage('מזהה יזם לא תקין'),
    check('integratorOrganizationIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי ארגוני אינטגרציה לא תקינים'),
    check('maintenanceOrganizationIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי ארגוני אחזקה לא תקינים'),
    check('controlCenterUserId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('מזהה איש מוקד לא תקין'),
    check('notificationRecipientIds')
      .optional()
      .custom(validateUserIds)
      .withMessage('מזהי משתמשים לא תקינים'),
    check('customFields')
      .optional()
      .isArray()
      .withMessage('שדות מותאמים אישית חייבים להיות מערך')
      .custom((fields) => {
        if (fields) {
          for (const field of fields) {
            if (!field.name || !field.value) {
              throw new Error('כל שדה מותאם אישית חייב להכיל שם וערך');
            }
          }
        }
        return true;
      })
  ],
  siteController.updateSite
);

// Delete site (admin only)
router.delete('/:id',
  roleAuth(PERMISSIONS.ADMIN),
  siteController.deleteSite
);

module.exports = router;
