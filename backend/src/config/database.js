require('dotenv').config();
const logger = require('../utils/logger');

// Validate database configuration
const validateConfig = () => {
  const requiredFields = ['DB_USER', 'DB_PASS', 'DB_NAME', 'DB_HOST'];
  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing database configuration: ${missingFields.join(', ')}`);
  }

  // Log full configuration (except password)
  logger.info('Database Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_PASS_LENGTH: process.env.DB_PASS ? process.env.DB_PASS.length : 0
  });
};

// Validate on module load
validateConfig();

const config = {
  jwtSecretLifetime: 24 * 60 * 60 * 1000, 
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: msg => logger.debug('Sequelize:', msg)
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'sqlite',
    storage: ':memory:',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: msg => logger.debug('Sequelize:', msg)
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  }
};

// Log which configuration is being used
logger.info(`Using ${process.env.NODE_ENV} database configuration`);

module.exports = config;
