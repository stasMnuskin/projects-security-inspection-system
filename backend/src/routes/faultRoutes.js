const express = require('express');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post('/', auth, roleAuth(['admin', 'security_officer']), faultController.createFault);
router.get('/site/:siteId', auth, faultController.getFaultsBySite);
router.put('/:id', auth, roleAuth(['admin', 'security_officer']), faultController.updateFault);
router.get('/open/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getOpenFaultsByEntrepreneur);
router.get('/recent/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getRecentFaultsByEntrepreneur);
router.get('/recurring/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getRecurringFaultsByEntrepreneur);
router.get('/all/site/:siteId', auth, roleAuth('entrepreneur'), faultController.getAllFaultsBySite);

module.exports = router;