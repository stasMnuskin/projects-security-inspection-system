'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Get all inspection types
      const inspectionTypes = await queryInterface.sequelize.query(
        'SELECT id, "formStructure" FROM "InspectionTypes"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Update each inspection type
      for (const inspType of inspectionTypes) {
        let formStructure = inspType.formStructure;

        // If formStructure is a string, parse it
        if (typeof formStructure === 'string') {
          formStructure = JSON.parse(formStructure);
        }

        // Update the field name from inspectorName to securityOfficer
        formStructure = formStructure.map(field => {
          if (field.id === 'inspectorName') {
            return {
              ...field,
              id: 'securityOfficer'
            };
          }
          return field;
        });

        // Update the inspection type
        await queryInterface.sequelize.query(
          `UPDATE "InspectionTypes" SET "formStructure" = :formStructure WHERE id = :id`,
          {
            replacements: {
              id: inspType.id,
              formStructure: JSON.stringify(formStructure)
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }

      // Get all inspections
      const inspections = await queryInterface.sequelize.query(
        'SELECT id, "formData" FROM "Inspections"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Update each inspection
      for (const inspection of inspections) {
        let formData = inspection.formData;

        // If formData is a string, parse it
        if (typeof formData === 'string') {
          formData = JSON.parse(formData);
        }

        // Update the field name from inspectorName to securityOfficer
        if (formData.inspectorName) {
          formData.securityOfficer = formData.inspectorName;
          delete formData.inspectorName;
        }

        // Update the inspection
        await queryInterface.sequelize.query(
          `UPDATE "Inspections" SET "formData" = :formData WHERE id = :id`,
          {
            replacements: {
              id: inspection.id,
              formData: JSON.stringify(formData)
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Get all inspection types
      const inspectionTypes = await queryInterface.sequelize.query(
        'SELECT id, "formStructure" FROM "InspectionTypes"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Update each inspection type
      for (const inspType of inspectionTypes) {
        let formStructure = inspType.formStructure;

        // If formStructure is a string, parse it
        if (typeof formStructure === 'string') {
          formStructure = JSON.parse(formStructure);
        }

        // Update the field name from securityOfficer back to inspectorName
        formStructure = formStructure.map(field => {
          if (field.id === 'securityOfficer') {
            return {
              ...field,
              id: 'inspectorName'
            };
          }
          return field;
        });

        // Update the inspection type
        await queryInterface.sequelize.query(
          `UPDATE "InspectionTypes" SET "formStructure" = :formStructure WHERE id = :id`,
          {
            replacements: {
              id: inspType.id,
              formStructure: JSON.stringify(formStructure)
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }

      // Get all inspections
      const inspections = await queryInterface.sequelize.query(
        'SELECT id, "formData" FROM "Inspections"',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Update each inspection
      for (const inspection of inspections) {
        let formData = inspection.formData;

        // If formData is a string, parse it
        if (typeof formData === 'string') {
          formData = JSON.parse(formData);
        }

        // Update the field name from securityOfficer back to inspectorName
        if (formData.securityOfficer) {
          formData.inspectorName = formData.securityOfficer;
          delete formData.securityOfficer;
        }

        // Update the inspection
        await queryInterface.sequelize.query(
          `UPDATE "Inspections" SET "formData" = :formData WHERE id = :id`,
          {
            replacements: {
              id: inspection.id,
              formData: JSON.stringify(formData)
            },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
};
