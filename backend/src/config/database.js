const logger = require('../utils/logger');

// For debugging purposes only
const config = {
  username: 'securityapp',
  password: 'postgres123',
  database: 'security_inspection_db',
  host: 'localhost',
  port: 5432,
  dialect: 'postgres'
};

logger.info('Using test configuration:', {
  ...config,
  password: '***'
});

module.exports = {
  development: {
    ...config,
    logging: msg => logger.debug('Sequelize:', msg)
  },
  test: {
    ...config,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    ...config,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};
