const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env.test' });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false
});

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the test database has been established successfully.');
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Unable to connect to the test database:', error);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
});

global.sequelize = sequelize;