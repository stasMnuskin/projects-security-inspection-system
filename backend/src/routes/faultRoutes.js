const faultController = require('../controllers/faultController');
const express = require('express');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

jest.mock('../../src/utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

const router = express.Router();

router.post('/', auth, roleAuth('admin', 'inspector'), faultController.createFault);
router.put('/:id/close', auth, roleAuth('admin', 'inspector'), faultController.closeFault);
router.get('/', auth, roleAuth('admin', 'inspector'), faultController.getFaultsByDateRange);

module.exports = router;