'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DraftInspection extends Model {
    static associate(models) {
      DraftInspection.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      DraftInspection.belongsTo(models.Site, { foreignKey: 'siteId', as: 'site' });
      DraftInspection.belongsTo(models.InspectionType, { foreignKey: 'inspectionTypeId', as: 'inspectionType' });
    }
  }

  DraftInspection.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    formData: {
      type: DataTypes.JSON,
      allowNull: false
    },
    newFaults: {
      type: DataTypes.JSON,
      allowNull: true
    },
    resolvedFaults: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'DraftInspection',
  });

  return DraftInspection;
};
