const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/inspections-by-date', auth, roleAuth('admin', 'security_officer','inspector'), reportController.getInspectionsByDateRange);

router.get('/stats-by-entrepreneur', auth, roleAuth('admin', 'security_officer', 'inspector'), reportController.getInspectionStatsByEntrepreneur);
router.get('/status-summary', auth, roleAuth('admin', 'security_officer', 'inspector'), reportController.getInspectionStatusSummary);
router.get('/csv', auth, roleAuth('admin', 'manager'), reportController.exportInspectionsToCsv);
router.get('/pdf', auth, roleAuth('admin', 'manager'), reportController.exportInspectionsToPdf);

module.exports = router;