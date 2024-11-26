module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Faults', 'maintenanceOrganizationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Faults', 'integratorOrganizationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Migrate existing data
    const faults = await queryInterface.sequelize.query(
      `SELECT f.id, mu."organizationId" as "maintenanceOrgId", iu."organizationId" as "integratorOrgId"
       FROM "Faults" f
       LEFT JOIN "Users" mu ON f."maintenanceUserId" = mu.id
       LEFT JOIN "Users" iu ON f."integratorUserId" = iu.id
       WHERE mu."organizationId" IS NOT NULL OR iu."organizationId" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const fault of faults) {
      await queryInterface.sequelize.query(
        `UPDATE "Faults" 
         SET "maintenanceOrganizationId" = :maintenanceOrgId,
             "integratorOrganizationId" = :integratorOrgId
         WHERE id = :faultId`,
        {
          replacements: {
            maintenanceOrgId: fault.maintenanceOrgId,
            integratorOrgId: fault.integratorOrgId,
            faultId: fault.id
          },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Faults', 'maintenanceOrganizationId');
    await queryInterface.removeColumn('Faults', 'integratorOrganizationId');
  }
};
