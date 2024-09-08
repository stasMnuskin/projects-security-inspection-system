const express = require('express');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/', auth, faultController.getAllFaults); // New route to get all faults
router.post('/', auth, roleAuth(['admin', 'security_officer']), faultController.createFault);
router.get('/site/:siteId', auth, faultController.getFaultsBySite);
router.put('/:id', auth, roleAuth(['admin', 'security_officer']), faultController.updateFault);
router.get('/open/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getOpenFaultsByEntrepreneur);
router.get('/recent/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getRecentFaultsByEntrepreneur);
router.get('/recurring/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getRecurringFaultsByEntrepreneur);
router.get('/all/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getAllFaultsBySite);

router.get('/open/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getOpenFaultsBySite);
router.get('/recent/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getRecentFaultsBySite);
router.get('/recurring/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getRecurringFaultsBySite);

router.get('/statistics/site', auth, roleAuth('entrepreneur'), faultController.getStatisticsBySite);
router.get('/statistics/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getStatisticsBySite);
router.get('/statistics/location', auth, roleAuth('entrepreneur'), faultController.getStatisticsByLocation);
router.get('/statistics/location/:siteId', auth, roleAuth('entrepreneur'), faultController.getStatisticsByLocation);

module.exports = router;