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
    }

    // Helper method to get inspection date
    getDate() {
      return this.formData?.date;
    }

    // Helper method to get inspector name
    getInspectorName() {
      return this.formData?.securityOfficer;  // Always use securityOfficer
    }

    // Helper method to check if this is a drill
    isDrill() {
      return this.type === 'drill';
    }

    // Helper method to check if this is an inspection
    isInspection() {
      return this.type === 'inspection';
    }

    // Helper method to get drill type
    getDrillType() {
      return this.isDrill() ? this.formData?.drill_type : null;
    }

    // Helper method to get drill status
    getDrillStatus() {
      return this.isDrill() ? this.formData?.status : null;
    }

    // Generic method to get field value
    getFieldValue(fieldId) {
      return this.formData?.[fieldId];
    }

    // Helper method to validate drill fields
    async validateDrillFields(data) {
      // Get inspection type
      const inspectionType = await sequelize.models.InspectionType.findByPk(this.inspectionTypeId);
      if (!inspectionType) {
        throw new Error('סוג תרגיל לא נמצא');
      }

      // Get enabled fields
      const fields = inspectionType.formStructure.filter(field => field.enabled);
      
      // Validate each field
      fields.forEach(field => {
        const value = data[field.id];

        // Check if field is required
        if (field.required && !value) {
          throw new Error(`שדה ${field.label} הוא חובה`);
        }

        // Check if field is required based on another field's value
        if (field.requiredIf) {
          const { field: dependentField, value: dependentValue } = field.requiredIf;
          if (data[dependentField] === dependentValue && !data[field.id]?.trim()) {
            throw new Error(`שדה ${field.label} הוא חובה כאשר ${dependentField} הוא ${dependentValue}`);
          }
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
      allowNull: false,
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
            // Get enabled fields from inspection type
            const enabledFields = inspectionType.formStructure.filter(field => field.enabled);

            // Validate required fields
            enabledFields.forEach(field => {
              if (field.required && !data.hasOwnProperty(field.id)) {
                throw new Error(`שדה חובה חסר: ${field.label}`);
              }

              // Check if field is required based on another field's value
              if (field.requiredIf) {
                const { field: dependentField, value: dependentValue } = field.requiredIf;
                if (data[dependentField] === dependentValue && !data[field.id]?.trim()) {
                  throw new Error(`שדה ${field.label} הוא חובה כאשר ${dependentField} הוא ${dependentValue}`);
                }
              }

              // Validate field type if value exists
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
                    if (field.required && !value.trim()) {
                      throw new Error(`שדה ${field.label} לא יכול להיות ריק`);
                    }
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
