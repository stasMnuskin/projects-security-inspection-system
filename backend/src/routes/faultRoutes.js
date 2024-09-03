const express = require('express');
const faultController = require('../controllers/faultController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.post('/', auth, roleAuth(['admin', 'security_officer']), faultController.createFault);
router.get('/site/:siteId', auth, faultController.getFaultsBySite);
router.put('/:id', auth, roleAuth(['admin', 'security_officer']), faultController.updateFault);
router.get('/open/entrepreneur', auth, roleAuth('entrepreneur'), faultController.getOpenFaultsByEntrepreneur);

module.exports = router;