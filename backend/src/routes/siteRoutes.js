const express = require('express');
const siteController = require('../controllers/siteController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post('/', auth, roleAuth('admin'), siteController.createSite);
router.get('/', auth, siteController.getAllSites);
router.get('/:id', auth, siteController.getSite);
router.put('/:id', auth, roleAuth('admin'), siteController.updateSite);
router.delete('/:id', auth, roleAuth('admin'), siteController.deleteSite);
router.get('/entrepreneur', 
  (req, res, next) => {
    logger.info('Entering /entrepreneur route');
    next();
  },
  auth, 
  (req, res, next) => {
    logger.info('After auth middleware');
    next();
  },
  roleAuth('entrepreneur'), 
  (req, res, next) => {
    logger.info('After roleAuth middleware');
    next();
  },
  siteController.getSitesByEntrepreneur
);


module.exports = router;