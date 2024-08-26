'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Fault extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // define association here
      }
    }
    Fault.init({
        siteId: DataTypes.INTEGER,
        inspectionTypeId: DataTypes.INTEGER,
        parameter: DataTypes.STRING,
        status: DataTypes.ENUM('open', 
          'closed'), openedAt: DataTypes.DATE, closedAt: DataTypes.DATE
        },
        {
          sequelize,
          modelName: 'Fault',
        });
      return Fault;
    };