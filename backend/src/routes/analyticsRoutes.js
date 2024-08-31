const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/statistics', auth, roleAuth('admin'), analyticsController.getStatistics);
router.get('/alerts', [auth, roleAuth('admin', 'inspector')], analyticsController.getAlerts);

module.exports = router;