const express = require('express');
const siteController = require('../controllers/siteController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const logger = require('../utils/logger');

const router = express.Router();

// Log all requests
router.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// Route for getting sites by authenticated entrepreneur
router.get('/entrepreneur', 
  auth,
  roleAuth('entrepreneur'),
  (req, res, next) => {
    logger.info(`Attempting to fetch sites for authenticated entrepreneur: ${req.user.id}`);
    next();
  },
  siteController.getSitesByAuthenticatedEntrepreneur
);

// Route for getting sites by specific entrepreneur ID (for security officers and admins)
router.get('/entrepreneur/:entrepreneurId', 
  auth,
  roleAuth(['security_officer', 'admin', 'entrepreneur']),
  (req, res, next) => {
    logger.info(`Attempting to fetch sites for entrepreneur: ${req.params.entrepreneurId}`);
    next();
  },
  siteController.getSitesByEntrepreneur
);

router.get('/:siteId/faults', auth, siteController.getFaultsBySite);

// General routes
router.post('/', auth, roleAuth('admin'), siteController.createSite);
router.get('/', auth, siteController.getAllSites);
router.get('/:id', auth, siteController.getSiteById);
router.put('/:id', auth, roleAuth('admin'), siteController.updateSite);
router.delete('/:id', auth, roleAuth('admin'), siteController.deleteSite);

// Catch-all route for debugging
router.use('*', (req, res, next) => {
  logger.warn(`Unmatched route: ${req.method} ${req.originalUrl}`);
  next();
});

module.exports = router;