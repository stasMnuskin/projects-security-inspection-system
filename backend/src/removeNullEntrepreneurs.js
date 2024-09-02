const { sequelize } = require('./models');

async function removeNullEntrepreneurs() {
  try {
    const [results, metadata] = await sequelize.query("DELETE FROM \"Sites\" WHERE \"entrepreneurId\" IS NULL;");
    console.log('Deleted rows:', metadata);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

removeNullEntrepreneurs();