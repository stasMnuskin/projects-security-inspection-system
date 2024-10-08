const express = require('express');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/', auth, faultController.getAllFaults); 
router.post('/', auth, roleAuth(['admin', 'security_officer']), faultController.createFault);
router.get('/site/:siteId', auth, faultController.getFaultsBySite);
router.put('/:id', auth, roleAuth(['admin', 'security_officer']), faultController.updateFault);
router.get('/open/entrepreneur', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getOpenFaultsByEntrepreneur);
router.get('/recent/entrepreneur', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getRecentFaultsByEntrepreneur);
router.get('/recurring/entrepreneur', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getRecurringFaultsByEntrepreneur);
router.get('/all/site/:siteId', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getAllFaultsBySite);

router.get('/open/site/:siteId', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getOpenFaultsBySite);
router.get('/recent/site/:siteId', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getRecentFaultsBySite);
router.get('/recurring/site/:siteId', auth, roleAuth(['admin','entrepreneur', 'security_officer']), faultController.getRecurringFaultsBySite);

router.get('/statistics/site', auth, roleAuth(['admin','entrepreneur']), faultController.getStatisticsBySite);
router.get('/statistics/site/:siteId', auth, roleAuth(['admin','entrepreneur']), faultController.getStatisticsBySite);
router.get('/statistics/location', auth, roleAuth(['admin','entrepreneur']), faultController.getStatisticsByLocation);
router.get('/statistics/location/:siteId', auth, roleAuth(['admin','entrepreneur']), faultController.getStatisticsByLocation);

module.exports = router;