'use strict';

const { ROLES } = require('../constants/roles');

module.exports = {
  async up(queryInterface, Sequelize) {
    const RolePermissions = require('../models/RolePermissions')(queryInterface.sequelize, Sequelize.DataTypes);
    
    for (const role of Object.values(ROLES)) {
      await RolePermissions.initializeRole(role);
    }
  },

  async down(queryInterface, Sequelize) {
  }
};
