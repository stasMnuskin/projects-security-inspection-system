'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('InspectionTypes', 'formStructure', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    });

    const formStructures = await queryInterface.sequelize.query(
      'SELECT * FROM "InspectionFormStructures"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const formStructure of formStructures) {
      await queryInterface.sequelize.query(
        'UPDATE "InspectionTypes" SET "formStructure" = :formStructure WHERE id = :id',
        {
          replacements: { 
            formStructure: formStructure.formStructure,
            id: formStructure.inspectionTypeId
          },
          type: queryInterface.sequelize.QueryTypes.UPDATE
        }
      );
    }

    await queryInterface.dropTable('InspectionFormStructures');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InspectionFormStructures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      inspectionTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'InspectionTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      formStructure: {
        type: Sequelize.JSON,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    const inspectionTypes = await queryInterface.sequelize.query(
      'SELECT * FROM "InspectionTypes" WHERE "formStructure" IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const inspectionType of inspectionTypes) {
      await queryInterface.sequelize.query(
        'INSERT INTO "InspectionFormStructures" ("inspectionTypeId", "formStructure", "createdAt", "updatedAt") VALUES (:id, :formStructure, :createdAt, :updatedAt)',
        {
          replacements: { 
            id: inspectionType.id,
            formStructure: inspectionType.formStructure,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          type: queryInterface.sequelize.QueryTypes.INSERT
        }
      );
    }

    await queryInterface.removeColumn('InspectionTypes', 'formStructure');
  }
};