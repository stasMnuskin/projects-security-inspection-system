'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inspection extends Model {
    static associate(models) {
      Inspection.belongsTo(models.User, {
        foreignKey: 'entrepreneurId',
        as: 'entrepreneur'
      });
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
    }
  }
  
  Inspection.init({
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
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
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'pending'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false
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