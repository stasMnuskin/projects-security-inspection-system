const express = require('express');
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, notificationController.getUserNotifications);
router.put('/:id/read', auth, notificationController.markNotificationAsRead);

module.exports = router;