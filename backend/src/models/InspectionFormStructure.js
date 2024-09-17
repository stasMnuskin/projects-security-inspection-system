'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InspectionFormStructure extends Model {
    static associate(models) {
      InspectionFormStructure.belongsTo(models.InspectionType, {
        foreignKey: 'inspectionTypeId',
        as: 'inspectionType'
      });
    }
  }

  InspectionFormStructure.init({
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'InspectionTypes',
        key: 'id'
      }
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'InspectionFormStructure',
  });

  return InspectionFormStructure;
};