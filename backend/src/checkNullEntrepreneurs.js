const { sequelize } = require('./models');

async function checkNullEntrepreneurs() {
  try {
    // const [results, metadata] = await sequelize.query("SELECT * FROM \"Sites\" WHERE \"entrepreneurId\" IS NULL;");
    
    const [results, metadata] = await sequelize.query("SELECT * FROM \"Sites\"");

    console.log('Sites with null entrepreneurId:', results);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkNullEntrepreneurs();