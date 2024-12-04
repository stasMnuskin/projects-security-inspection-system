'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const logger = require('../utils/logger');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load database config
const configPath = path.join(__dirname, '/../config/database.js');
logger.info('Loading database config from:', configPath);
const config = require(configPath)[env];

// Log loaded configuration
logger.info('Loaded database configuration:', {
  env,
  config: {
    ...config,
    password: '***'
  }
});

const db = {};

let sequelize;
try {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    host: config.host,
    port: config.port,
    dialect: config.dialect
  });
  
  logger.info('Sequelize instance created successfully');
} catch (error) {
  logger.error('Error creating Sequelize instance:', error);
  throw error;
}

// Load models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
      logger.info(`Loaded model: ${model.name}`);
    } catch (error) {
      logger.error(`Error loading model ${file}:`, error);
      throw error;
    }
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      logger.info(`Set up associations for model: ${modelName}`);
    } catch (error) {
      logger.error(`Error setting up associations for ${modelName}:`, error);
      throw error;
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
