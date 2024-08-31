const db = require('./src/models');
const { clearDatabase } = require('./__tests__/fixtures/db');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await db.sequelize.close();
});