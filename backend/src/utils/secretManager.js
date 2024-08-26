const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);

let activeSecrets = [process.env.JWT_SECRET];
const secretLifetime = 24 * 60 * 60 * 1000; 

async function rotateSecrets() {
  const newSecret = (await randomBytes(32)).toString('hex');
  activeSecrets.unshift(newSecret);
  
  if (activeSecrets.length > 2) {
    activeSecrets.pop();
  }
}

// Initialize secret rotation
setInterval(rotateSecrets, secretLifetime);

function getActiveSecrets() {
  return activeSecrets;
}

module.exports = {
  getActiveSecrets
};