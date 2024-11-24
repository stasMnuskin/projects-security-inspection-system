module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all users with their organizations
      const users = await queryInterface.sequelize.query(
        `SELECT id, role, organization FROM "Users" WHERE role IN ('integrator', 'maintenance') AND organization IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Group users by organization and role
      const organizationsByName = {};
      users.forEach(user => {
        if (!organizationsByName[user.organization]) {
          organizationsByName[user.organization] = {
            integrators: [],
            maintenance: []
          };
        }
        if (user.role === 'integrator') {
          organizationsByName[user.organization].integrators.push(user.id);
        } else {
          organizationsByName[user.organization].maintenance.push(user.id);
        }
      });

      // Create organizations
      for (const [orgName, data] of Object.entries(organizationsByName)) {
        // Determine organization type based on users
        const type = data.integrators.length > 0 ? 'integrator' : 'maintenance';
        
        // Create organization
        const [organization] = await queryInterface.sequelize.query(
          `INSERT INTO "Organizations" (name, type, "createdAt", "updatedAt") 
           VALUES (:name, :type, NOW(), NOW()) RETURNING id`,
          {
            replacements: { name: orgName, type },
            type: Sequelize.QueryTypes.INSERT,
            transaction
          }
        );

        const organizationId = organization[0].id;

        // Update users with organization ID
        const userIds = [...data.integrators, ...data.maintenance];
        await queryInterface.sequelize.query(
          `UPDATE "Users" SET "organizationId" = :organizationId WHERE id IN (:userIds)`,
          {
            replacements: { organizationId, userIds },
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        );

        // Get all sites with their integrator and maintenance user IDs
        const sites = await queryInterface.sequelize.query(
          `SELECT id, "integratorUserIds", "maintenanceUserIds" FROM "Sites"`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        // Create OrganizationSites relationships
        for (const site of sites) {
          const integratorIds = site.integratorUserIds || [];
          const maintenanceIds = site.maintenanceUserIds || [];
          
          // Check if any user from this organization is associated with this site
          const hasIntegrator = integratorIds.some(id => data.integrators.includes(id));
          const hasMaintenance = maintenanceIds.some(id => data.maintenance.includes(id));

          if (hasIntegrator || hasMaintenance) {
            await queryInterface.sequelize.query(
              `INSERT INTO "OrganizationSites" ("organizationId", "siteId", "createdAt", "updatedAt")
               VALUES (:organizationId, :siteId, NOW(), NOW())`,
              {
                replacements: { organizationId, siteId: site.id },
                type: Sequelize.QueryTypes.INSERT,
                transaction
              }
            );
          }
        }
      }

      // Remove organization column from Users table
      await queryInterface.removeColumn('Users', 'organization', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add back organization column to Users table
      await queryInterface.addColumn('Users', 'organization', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      // Get all users with their organizations
      const users = await queryInterface.sequelize.query(
        `SELECT u.id, u.role, o.name as organization_name 
         FROM "Users" u 
         JOIN "Organizations" o ON u."organizationId" = o.id`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Update users with organization names
      for (const user of users) {
        await queryInterface.sequelize.query(
          `UPDATE "Users" SET organization = :orgName WHERE id = :userId`,
          {
            replacements: { orgName: user.organization_name, userId: user.id },
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      // Get all organization-site relationships
      const orgSites = await queryInterface.sequelize.query(
        `SELECT os."organizationId", os."siteId", o.type, u.id as user_id
         FROM "OrganizationSites" os
         JOIN "Organizations" o ON os."organizationId" = o.id
         JOIN "Users" u ON u."organizationId" = o.id`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Update sites with user IDs
      for (const orgSite of orgSites) {
        const column = orgSite.type === 'integrator' ? 'integratorUserIds' : 'maintenanceUserIds';
        await queryInterface.sequelize.query(
          `UPDATE "Sites" 
           SET "${column}" = COALESCE("${column}", '[]'::jsonb) || :userId::jsonb
           WHERE id = :siteId`,
          {
            replacements: { userId: JSON.stringify([orgSite.user_id]), siteId: orgSite.siteId },
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      // Drop OrganizationSites table
      await queryInterface.dropTable('OrganizationSites', { transaction });

      // Drop Organizations table
      await queryInterface.dropTable('Organizations', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
