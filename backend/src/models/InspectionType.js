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

    // Get automatic fields that should always appear in the table
    static getAutoFields() {
      return [
        { id: 'site', label: 'אתר', type: 'text', autoFill: true },
        { id: 'securityOfficer', label: 'קב"ט', type: 'text', autoFill: true },
        { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
        { id: 'time', label: 'שעה', type: 'time', autoFill: true }
      ];
    }

    // Get all fields for this inspection type
    async getAllFields() {
      const currentFields = Array.isArray(this.formStructure) ? this.formStructure : [];
      return currentFields.map(field => ({
        ...field,
        enabled: field.enabled || false,
        showInForm: field.showInForm !== false
      }));
    }

    // Get enabled fields for form (including auto fields)
    async getFormFields() {
      const fields = await this.getAllFields();
      const enabledFields = fields.filter(field => field.enabled);
      const autoFields = InspectionType.getAutoFields();
      return [...autoFields, ...enabledFields];
    }

    // Get enabled fields for table by site type
    static async getTableFields(siteType) {
      // Get all inspection types
      const types = await this.findAll({
        where: { type: 'inspection' }
      });

      // Filter types by site type
      const relevantTypes = types.filter(inspType => {
        if (!inspType.name.includes('ביקורת שגרתית')) return true;
        if (siteType === 'radar') {
          return inspType.name.includes('מכ"מ');
        } else if (siteType === 'inductive_fence') {
          return inspType.name.includes('גדר');
        }
        return false;
      });

      // Get enabled fields from relevant types
      const enabledFields = new Map();
      
      relevantTypes.forEach(inspType => {
        if (Array.isArray(inspType.formStructure)) {
          inspType.formStructure.forEach(field => {
            if (field.enabled) {
              enabledFields.set(field.id, {
                ...field,
                showInForm: field.showInForm !== false
              });
            }
          });
        }
      });

      // Combine auto fields with enabled fields
      return [...this.getAutoFields(), ...Array.from(enabledFields.values())];
    }

    // Get drill type fields
    static async getDrillTypeFields(drillType) {
      const type = await this.findOne({
        where: { 
          type: 'drill',
          name: drillType
        }
      });

      if (!type) return [];

      const fields = type.formStructure
        .filter(field => field.enabled)
        .map(field => ({
          ...field,
          showInForm: field.showInForm !== false
        }));

      return [...this.getAutoFields(), ...fields];
    }

    // Update field status (enabled/disabled)
    async updateFieldStatus(fieldId, enabled) {
      let currentFields = Array.isArray(this.formStructure) ? this.formStructure : [];
      
      const updatedFields = currentFields.map(field => 
        field.id === fieldId ? { ...field, enabled } : field
      );

      this.formStructure = updatedFields;
      await this.save();
    }

    // Add new field to all inspection types
    async addCustomField(field) {
      if (!field.id || !field.label || !field.type) {
        throw new Error('Invalid field structure');
      }

      // Add field to all inspection types of the same type
      const allTypes = await InspectionType.findAll({
        where: { type: this.type }
      });
      
      for (const type of allTypes) {
        let typeFields = Array.isArray(type.formStructure) ? type.formStructure : [];
        
        // Add field if it doesn't exist
        if (!typeFields.some(f => f.id === field.id)) {
          typeFields.push({
            ...field,
            enabled: type.id === this.id, // Enable only for current type
            showInForm: field.showInForm !== false
          });
          type.formStructure = typeFields;
          await type.save();
        }
      }
    }

    // Delete field from all inspection types
    async deleteField(fieldId) {
      // Remove field from all inspection types of the same type
      const allTypes = await InspectionType.findAll({
        where: { type: this.type }
      });
      
      for (const type of allTypes) {
        let typeFields = Array.isArray(type.formStructure) ? type.formStructure : [];
        type.formStructure = typeFields.filter(f => f.id !== fieldId);
        await type.save();
      }
    }

    // Validate field dependencies
    validateFieldDependencies(formData) {
      const fields = Array.isArray(this.formStructure) ? this.formStructure : [];
      
      fields.forEach(field => {
        // Check required field
        if (field.required && !formData[field.id]) {
          throw new Error(`שדה ${field.label} הוא חובה`);
        }

        // Check requiredIf condition
        if (field.requiredIf) {
          const { field: dependentField, value } = field.requiredIf;
          if (formData[dependentField] === value && !formData[field.id]?.trim()) {
            throw new Error(`שדה ${field.label} הוא חובה כאשר ${dependentField} הוא ${value}`);
          }
        }
      });
    }
  }

  InspectionType.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.ENUM('inspection', 'drill'),
      allowNull: false,
      defaultValue: 'inspection'
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidStructure(value) {
          const structure = typeof value === 'string' ? JSON.parse(value) : value;
          
          if (!Array.isArray(structure)) {
            throw new Error('מבנה הטופס חייב להיות מערך');
          }

          structure.forEach(field => {
            // Validate basic field structure
            if (!field.id || !field.label || !field.type) {
              throw new Error('כל שדה חייב לכלול מזהה, תווית וסוג');
            }

            // Validate fieldType
            if (!['inspection', 'drill'].includes(field.fieldType)) {
              throw new Error('סוג השדה חייב להיות ביקורת או תרגיל');
            }

            // Validate select options
            if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length === 0)) {
              throw new Error(`שדה ${field.label} מסוג select חייב לכלול אפשרויות בחירה`);
            }

            // Validate requiredIf structure
            if (field.requiredIf && (!field.requiredIf.field || !field.requiredIf.value)) {
              throw new Error(`תנאי חובה לא תקין בשדה ${field.label}`);
            }

            // Validate showInForm
            if (typeof field.showInForm !== 'boolean') {
              field.showInForm = true; // Default to true if not specified
            }
          });
        }
      }
    }
  }, {
    sequelize,
    modelName: 'InspectionType'
  });

  return InspectionType;
};
