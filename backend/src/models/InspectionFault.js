'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InspectionFault extends Model {
    static associate(models) {
      // define association here
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
    criterionId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'InspectionFault',
  });
  return InspectionFault;
};