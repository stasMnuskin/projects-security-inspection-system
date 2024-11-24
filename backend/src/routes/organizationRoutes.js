const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const organizationController = require('../controllers/organizationController');

const router = express.Router();

// Validation middleware
const validateOrganization = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('נדרש שם ארגון')
    .isLength({ max: 100 })
    .withMessage('שם ארגון ארוך מדי'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('נדרש סוג ארגון')
    .isIn(['integrator', 'maintenance'])
    .withMessage('סוג ארגון לא תקין'),
  validate
];

// Routes
router.post('/', auth, validateOrganization, organizationController.createOrganization);
router.get('/', auth, organizationController.getOrganizations);
router.get('/:id', auth, organizationController.getOrganization);
router.put('/:id', auth, [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('נדרש שם ארגון')
    .isLength({ max: 100 })
    .withMessage('שם ארגון ארוך מדי'),
  validate
], organizationController.updateOrganization);
router.delete('/:id', auth, organizationController.deleteOrganization);

module.exports = router;
