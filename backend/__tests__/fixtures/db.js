const db = require('../../src/models');

async function clearDatabase() {
  const tables = ['Inspection', 'InspectionType', 'Site', 'Entrepreneur', 'User'];
  for (const table of tables) {
    if (db[table]) {
      await db[table].destroy({ where: {}, force: true });
    }
  }
}

async function createUser(overrides = {}) {
  return db.User.create({
    username: 'testuser432',
    email: 'test32@example.com',
    password: 'password32123',
    role: 'admin',
    ...overrides
  });
}

async function createEntrepreneur(overrides = {}) {
  return db.Entrepreneur.create({
    name: 'Test Entrepreneur',
    contactPerson: 'John Doe',
    email: 'entrepreneur@test.com',
    phone: '1234567890',
    ...overrides
  });
}

async function createSite(overrides = {}) {
  const entrepreneur = overrides.entrepreneurId ? { id: overrides.entrepreneurId } : await createEntrepreneur();
  return db.Site.create({
    name: 'Test Site',
    entrepreneurId: entrepreneur.id,
    ...overrides
  });
}

async function createInspectionType(overrides = {}) {
  const site = overrides.siteId ? { id: overrides.siteId } : await createSite();
  return db.InspectionType.create({
    name: 'Test Inspection Type',
    siteId: site.id,
    formStructure: JSON.stringify({ field1: 'text', field2: 'checkbox' }),
    ...overrides
  });
}

async function createInspection(overrides = {}) {
  const user = overrides.userId ? { id: overrides.userId } : await createUser();
  const entrepreneur = overrides.entrepreneurId ? { id: overrides.entrepreneurId } : await createEntrepreneur();
  const site = overrides.siteId ? { id: overrides.siteId } : await createSite({ entrepreneurId: entrepreneur.id });
  const inspectionType = overrides.inspectionTypeId ? { id: overrides.inspectionTypeId } : await createInspectionType({ siteId: site.id });

  return db.Inspection.create({
    entrepreneurId: entrepreneur.id,
    siteId: site.id,
    inspectionTypeId: inspectionType.id,
    userId: user.id,
    details: { test: 'data' },
    status: 'pending',
    ...overrides
  });
}

module.exports = {
  clearDatabase,
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType,
  createInspection
};