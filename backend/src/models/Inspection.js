'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inspection extends Model {
    static associate(models) {
      Inspection.belongsTo(models.User, { foreignKey: 'UserId' });
    }
  }

  Inspection.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        hasSeverity(value) {
          if (!value.severity) {
            throw new Error('Severity must be specified in details');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Inspection',
    tableName: 'Inspections'
  });

  return Inspection;
};