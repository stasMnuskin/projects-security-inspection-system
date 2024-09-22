'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inspection extends Model {
    static associate(models) {
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
      Inspection.belongsToMany(models.Fault, {
        through: models.InspectionFault,
        foreignKey: 'inspectionId',
        otherKey: 'faultId'
      });
    }
  }
  
  Inspection.init({
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    formData: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidFormData(value) {
          const data = JSON.parse(value);
          const requiredFields = ['siteName', 'date', 'securityOfficerName', 'lastInspectionDate'];
          
          requiredFields.forEach(field => {
            if (!data.hasOwnProperty(field)) {
              throw new Error(`Missing required field: ${field}`);
            }
          });

          // Additional validation based on inspection type
          const inspectionType = data.inspectionType;
          switch (inspectionType) {
            case 'ביקורת שגרתית':
              ['accessRoad', 'gate', 'fence', 'cameras', 'announcement', 'lighting', 'vegetation', 'generalNotes'].forEach(field => {
                if (!data.hasOwnProperty(field)) {
                  throw new Error(`Missing required field for routine inspection: ${field}`);
                }
                if (field !== 'generalNotes' && typeof data[field] !== 'boolean') {
                  throw new Error(`Invalid value for ${field}. Must be a boolean.`);
                }
              });
              break;
            case 'ביקורת משטרה':
            case 'ביקורת משרד האנרגיה':
              if (!data.hasOwnProperty('passed')) {
                throw new Error('Missing "passed" field');
              }
              if (!data.hasOwnProperty('notes')) {
                throw new Error('Missing "notes" field');
              }
              break;
            case 'תרגיל פנימי':
              if (!data.hasOwnProperty('drillType')) {
                throw new Error('Missing "drillType" field');
              }
              if (!data.hasOwnProperty('passed')) {
                throw new Error('Missing "passed" field');
              }
              if (!data.hasOwnProperty('notes')) {
                throw new Error('Missing "notes" field');
              }
              break;
            default:
              throw new Error('Invalid inspection type');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'completed'
    }
  }, {
    sequelize,
    modelName: 'Inspection',
  });
  
  return Inspection;
};