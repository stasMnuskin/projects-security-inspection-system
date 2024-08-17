const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};

db.Entrepreneur = require('./Entrepreneur')(sequelize, Sequelize.DataTypes);
db.Site = require('./Site')(sequelize, Sequelize.DataTypes);
db.InspectionType = require('./InspectionType')(sequelize, Sequelize.DataTypes);
db.Inspection = require('./Inspection')(sequelize, Sequelize.DataTypes);
db.User = require('./User')(sequelize, Sequelize.DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;