'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InspectionType extends Model {
    static associate(models) {
      InspectionType.hasMany(models.Inspection, {
        foreignKey: 'inspectionTypeId',
        as: 'inspections'
      });
      InspectionType.hasOne(models.InspectionFormStructure, {
        foreignKey: 'inspectionTypeId',
        as: 'formStructure'
      });
    }
  }

  InspectionType.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'InspectionType',
  });

  return InspectionType;
};