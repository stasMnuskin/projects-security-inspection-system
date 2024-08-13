const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.development);

const User = require('./User')(sequelize);
const Inspection = require('./Inspection')(sequelize);

// Define associations
User.hasMany(Inspection);
Inspection.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Inspection,
};