'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Entrepreneur extends Model {
    static associate(models) {
      Entrepreneur.hasMany(models.Site, {
        foreignKey: 'entrepreneurId',
        as: 'sites'
      });
    }
  }
  
  Entrepreneur.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    sequelize,
    modelName: 'Entrepreneur',
    tableName: 'Entrepreneurs'
  });
  
  return Entrepreneur;
};