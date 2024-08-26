const jwt = require('jsonwebtoken');
const { getActiveSecrets } = require('./secretManager');

exports.generateTestToken = (userId, role) => {
  const activeSecrets = getActiveSecrets();
  return jwt.sign(
    { id: userId, role: role },
    activeSecrets[0], 
    { expiresIn: '1h' }
  );
};