'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Site extends Model {
    static associate(models) {
      Site.belongsTo(models.Entrepreneur, {
        foreignKey: 'entrepreneurId',
        as: 'entrepreneur',
        allowNull: false
      });
      Site.hasMany(models.InspectionType, {
        foreignKey: 'siteId',
        as: 'inspectionTypes'
      });
    }
  }
  
  Site.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Entrepreneurs',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Site',
    tableName: 'Sites'
  });
  
  return Site;
};