'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InspectionType extends Model {
    static associate(models) {
      InspectionType.hasMany(models.Inspection, {
        foreignKey: 'inspectionTypeId',
        as: 'inspections'
      });
    }
  }

  InspectionType.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidStructure(value) {
          const structure = JSON.parse(value);
          const inspectionTypes = ['ביקורת שגרתית', 'ביקורת משטרה', 'ביקורת משרד האנרגיה', 'תרגיל פנימי'];
          
          if (!inspectionTypes.includes(structure.name)) {
            throw new Error('Invalid inspection type');
          }

          const commonFields = ['siteName', 'date', 'securityOfficerName', 'lastInspectionDate'];
          const routineFields = ['accessRoad', 'gate', 'fence', 'cameras', 'announcement', 'lighting', 'vegetation', 'generalNotes'];
          const otherFields = ['passed', 'notes'];
          const internalDrillFields = ['drillType'];

          let requiredFields;
          switch (structure.name) {
            case 'ביקורת שגרתית':
              requiredFields = [...commonFields, ...routineFields];
              break;
            case 'ביקורת משטרה':
            case 'ביקורת משרד האנרגיה':
              requiredFields = [...commonFields, ...otherFields];
              break;
            case 'תרגיל פנימי':
              requiredFields = [...commonFields, ...internalDrillFields, ...otherFields];
              break;
          }

          requiredFields.forEach(field => {
            if (!structure.fields.hasOwnProperty(field)) {
              throw new Error(`Missing required field: ${field}`);
            }
          });

          Object.keys(structure.fields).forEach(field => {
            if (!requiredFields.includes(field)) {
              throw new Error(`Invalid field for ${structure.name}: ${field}`);
            }

            if (!commonFields.includes(field)) {
              if (!structure.fields[field].hasOwnProperty('type') || 
                  !['boolean', 'text'].includes(structure.fields[field].type)) {
                throw new Error(`Invalid type for field ${field}`);
              }
            }

            if (!structure.fields[field].hasOwnProperty('label')) {
              throw new Error(`Missing label for field ${field}`);
            }
          });
        }
      }
    }
  }, {
    sequelize,
    modelName: 'InspectionType',
  });

  return InspectionType;
};