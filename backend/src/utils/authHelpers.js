const jwt = require('jsonwebtoken');

function generateTestToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment');
  }
  return jwt.sign(
    { 
      user: { 
        id: userId 
      }
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );
}

module.exports = { generateTestToken };