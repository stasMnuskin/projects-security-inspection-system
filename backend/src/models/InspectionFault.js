'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InspectionFault extends Model {
    static associate(models) {
      InspectionFault.belongsTo(models.Inspection, {
        foreignKey: 'inspectionId'
      });
      InspectionFault.belongsTo(models.Fault, {
        foreignKey: 'faultId'
      });
    }
  }
  InspectionFault.init({
    inspectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Inspections',
        key: 'id'
      }
    },
    faultId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Faults',
        key: 'id'
      }
    },
    fieldId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Identifier for the form field associated with this fault'
    }
  }, {
    sequelize,
    modelName: 'InspectionFault',
  });
  return InspectionFault;
};