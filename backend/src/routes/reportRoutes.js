const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/inspections-by-date', auth, roleAuth('admin', 'security_officer'), reportController.getInspectionsByDateRange);
router.get('/stats-by-entrepreneur', auth, roleAuth('admin', 'security_officer'), reportController.getInspectionStatsByEntrepreneur);
router.get('/status-summary', auth, roleAuth('admin', 'security_officer'), reportController.getInspectionStatusSummary);

module.exports = router;