'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update all faults where isPartiallyDisabling is null to set it to false
    return queryInterface.bulkUpdate(
      'Faults',
      { isPartiallyDisabling: false },
      { isPartiallyDisabling: null }
    );
  },

  async down(queryInterface, Sequelize) {
    // This is a data migration, no need to revert it
    return Promise.resolve();
  }
};
