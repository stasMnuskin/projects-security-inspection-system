'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.createTable('Faults', {
            id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER
            },
            siteId: {
              type: Sequelize.INTEGER
            },
            inspectionTypeId: {
              type: Sequelize.INTEGER
            },
            parameter: {
              type: Sequelize.STRING
            },
            status: {
              type: Sequelize.ENUM('open\', '
                closed ')
              },
              openedAt: {
                type: Sequelize.DATE
              },
              closedAt: {
                type: Sequelize.DATE
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
        },
        async down(queryInterface, Sequelize) {
          await queryInterface.dropTable('Faults');
        }
    };