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
        as: 'inspector',
        constraints: false 
      });
    }

    // method to get inspection date
    getDate() {
      return this.formData?.date;
    }

    // method to get inspector name
    getInspectorName() {
      return this.formData?.securityOfficer;  
    }

    // method to check if this is a drill
    isDrill() {
      return this.type === 'drill';
    }

    // method to check if this is an inspection
    isInspection() {
      return this.type === 'inspection';
    }

    // method to get drill type
    getDrillType() {
      return this.isDrill() ? this.formData?.drill_type : null;
    }

    // method to get drill status
    getDrillStatus() {
      return this.isDrill() ? this.formData?.status : null;
    }

    // method to get field value
    getFieldValue(fieldId) {
      return this.formData?.[fieldId];
    }

    // method to validate drill fields
    async validateDrillFields(data) {
      // Get inspection type
      const inspectionType = await sequelize.models.InspectionType.findByPk(this.inspectionTypeId);
      if (!inspectionType) {
        throw new Error('סוג תרגיל לא נמצא');
      }

      // Get enabled fields that are not autoFill
      const fields = inspectionType.formStructure.filter(field => field.enabled && !field.autoFill);
      
      // First validate drill_type as it affects other validations
      if (!data.drill_type) {
        throw new Error('סוג תרגיל הוא שדה חובה');
      }

      // Validate other fields based on drill_type
      fields.forEach(field => {
        const value = data[field.id];

        // Special handling for status field
        if (field.id === 'status') {
          // Only validate status if drill type is not 'אחר'
          if (data.drill_type !== 'אחר' && !value) {
            throw new Error('שדה סטטוס הוא חובה כאשר סוג התרגיל אינו "אחר"');
          }
          return;  // Skip other validations for status field
        }

        // Special handling for notes field
        if (field.id === 'notes') {
          // Notes are required if:
          // 1. Drill type is 'אחר' OR
          // 2. Status is 'לא תקין'
          const notesRequired = data.drill_type === 'אחר' || data.status === 'לא תקין';
          if (notesRequired && !value?.trim()) {
            throw new Error('שדה הערות הוא חובה במקרה זה');
          }
          return;  
        }

        // For other fields, check if they're required
        if (field.required && !value) {
          throw new Error(`שדה ${field.label} הוא חובה`);
        }

        // Validate field type if value exists
        if (value) {
          switch (field.type) {
            case 'select':
              if (!field.options?.includes(value)) {
                throw new Error(`ערך לא חוקי בשדה ${field.label}`);
              }
              break;
            case 'textarea':
              if (typeof value !== 'string') {
                throw new Error(`שדה ${field.label} חייב להיות טקסט`);
              }
              break;
          }
        }
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
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('inspection', 'drill'),
      allowNull: false,
      defaultValue: 'inspection'
    },
    formData: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        async isValidFormData(value) {
          const data = typeof value === 'string' ? JSON.parse(value) : value;
          
          // Get inspection type
          const inspectionType = await sequelize.models.InspectionType.findByPk(this.inspectionTypeId);
          if (!inspectionType) {
            throw new Error('סוג ביקורת לא נמצא');
          }

          // Validate based on type
          if (this.type === 'drill') {
            await this.validateDrillFields(data);
          } else {
            // Get enabled fields from inspection type, excluding autoFill fields
            const enabledFields = inspectionType.formStructure.filter(field => 
              field.enabled && !field.autoFill
            );
          
            enabledFields.forEach(field => {
              if (field.requiredIf) {
                const { field: dependentField, value: dependentValue } = field.requiredIf;
                if (data[dependentField] === dependentValue && !data[field.id]?.trim()) {
                  throw new Error(`שדה ${field.label} הוא חובה כאשר ${dependentField} הוא ${dependentValue}`);
                }
              }

              if (data.hasOwnProperty(field.id)) {
                const value = data[field.id];
                
                switch (field.type) {
                  case 'boolean':
                    if (!['תקין', 'לא תקין'].includes(value)) {
                      throw new Error(`שדה ${field.label} חייב להיות תקין/לא תקין`);
                    }
                    break;
                  case 'text':
                  case 'textarea':
                    if (typeof value !== 'string') {
                      throw new Error(`שדה ${field.label} חייב להיות טקסט`);
                    }
                    // No validation for required fields
                    break;
                  case 'date':
                    if (!(value instanceof Date) && isNaN(Date.parse(value))) {
                      throw new Error(`שדה ${field.label} חייב להיות תאריך תקין`);
                    }
                    break;
                  case 'time':
                    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                      throw new Error(`שדה ${field.label} חייב להיות שעה תקינה (HH:MM)`);
                    }
                    break;
                  case 'select':
                    if (!field.options?.includes(value)) {
                      throw new Error(`ערך לא חוקי בשדה ${field.label}`);
                    }
                    break;
                }
              }
            });
          }
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Inspection',
  });
  
  return Inspection;
};
