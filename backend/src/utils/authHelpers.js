const jwt = require('jsonwebtoken');

exports.generateTestToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};