const { sequelize, Entrepreneur, Site, InspectionType, Inspection, Fault, User } = require('./models');

async function clearAllTables() {
  try {
    await sequelize.transaction(async (t) => {
      await Fault.destroy({ where: {}, force: true, transaction: t });
      await Inspection.destroy({ where: {}, force: true, transaction: t });
      await InspectionType.destroy({ where: {}, force: true, transaction: t });
      await Site.destroy({ where: {}, force: true, transaction: t });
      await Entrepreneur.destroy({ where: {}, force: true, transaction: t });
      
      // await User.destroy({ where: {}, force: true, transaction: t });

      console.log('All records have been deleted from the tables.');
    });
  } catch (error) {
    console.error('Error clearing tables:', error);
  } finally {
    await sequelize.close();
  }
}

clearAllTables();