const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const logger = require('../utils/logger');

logger.info('Database Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT
});

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  dialectOptions: {
    application_name: 'security-inspection',
    supportBigNumbers: true,
    bigNumberStrings: true
  }
};

module.exports = {
  development: {
    ...baseConfig,
    logging: msg => logger.debug('Sequelize:', msg)
  },
  test: {
    ...baseConfig,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    ...baseConfig,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};
