const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../constants/roles');

const router = express.Router();

// Get dashboard overview data - requires dashboard permission
router.get('/dashboard/overview', auth, roleAuth(PERMISSIONS.DASHBOARD), analyticsController.getDashboardOverview);

// Get filter options - requires dashboard permission
router.get('/dashboard/filters', auth, roleAuth(PERMISSIONS.DASHBOARD), analyticsController.getFilterOptions);

module.exports = router;
