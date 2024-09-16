'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inspection extends Model {
    static associate(models) {
      Inspection.belongsTo(models.Site, {
        foreignKey: 'siteId'
      });
      Inspection.belongsTo(models.InspectionType, {
        foreignKey: 'inspectionTypeId'
      });
      Inspection.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'inspector'
      });
      Inspection.belongsToMany(models.Fault, {
        through: 'InspectionFault',
        foreignKey: 'inspectionId',
        otherKey: 'faultId'
      });
    }
  }
  
  Inspection.init({
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sites',
        key: 'id'
      }
    },
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'InspectionTypes',
        key: 'id'
      }
    },
    inspectorName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    criteria: {
      type: DataTypes.JSON,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'completed'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Inspection',
  });
  
  return Inspection;
};