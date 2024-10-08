const express = require('express');
const siteController = require('../controllers/siteController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const logger = require('../utils/logger');

const router = express.Router();

router.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

router.get('/entrepreneur', 
  auth,
  roleAuth('entrepreneur'),
  (req, res, next) => {
    logger.info(`Attempting to fetch sites for authenticated entrepreneur: ${req.user.id}`);
    next();
  },
  siteController.getSitesByAuthenticatedEntrepreneur
);

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

router.post('/', auth, roleAuth('admin'), siteController.createSite);
router.get('/', auth, siteController.getAllSites);
router.get('/:id', auth, siteController.getSiteById);
router.put('/:id', auth, roleAuth('admin'), siteController.updateSite);
router.delete('/:id', auth, roleAuth('admin'), siteController.deleteSite);

router.use('*', (req, res, next) => {
  logger.warn(`Unmatched route: ${req.method} ${req.originalUrl}`);
  next();
});

module.exports = router;