const jwt = require('jsonwebtoken');
const { getActiveSecrets } = require('./secretManager');

exports.generateTestToken = (userId, role = 'admin') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};