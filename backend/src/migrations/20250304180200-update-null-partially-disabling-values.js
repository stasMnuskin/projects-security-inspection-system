'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if the column exists
      const tableInfo = await queryInterface.describeTable('Faults');
      
      if (tableInfo.isPartiallyDisabling) {
        console.log('Updating null isPartiallyDisabling values to false');
        await queryInterface.bulkUpdate(
          'Faults',
          { isPartiallyDisabling: false },
          { isPartiallyDisabling: null }
        );
        console.log('Successfully updated null values');
      } else {
        console.log('isPartiallyDisabling column not found, skipping update');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating null isPartiallyDisabling values:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a data migration, no need to revert it
    return Promise.resolve();
  }
};
