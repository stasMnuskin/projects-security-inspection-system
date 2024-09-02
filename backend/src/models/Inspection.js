'use strict';
module.exports = (sequelize, DataTypes) => {
  const Inspection = sequelize.define('Inspection', {
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Entrepreneurs',
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
  }, {});

  Inspection.associate = function(models) {
    Inspection.belongsTo(models.Entrepreneur, { 
      foreignKey: 'entrepreneurId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.Site, { 
      foreignKey: 'siteId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.InspectionType, { 
      foreignKey: 'inspectionTypeId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.User, { 
      foreignKey: 'userId', 
      onDelete: 'SET NULL' 
    });
  };

  return Inspection;
};