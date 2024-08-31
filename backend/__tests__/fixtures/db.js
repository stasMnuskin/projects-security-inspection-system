const bcrypt = require('bcrypt');
const db = require('../../src/models');

const clearDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

const createUser = async (data = {}) => {
  const defaultData = {
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 10),
    role: 'inspector'
  };
  return await db.User.create({ ...defaultData, ...data });
};

const createEntrepreneur = async (overrides = {}) => {
  const defaultData = {
    name: `Test Entrepreneur ${Date.now()}`,  
    contactPerson: 'John Doe',
    phone: '1234567890',
    email: `entrepreneur${Date.now()}@test.com`  
  };
  try {
    const entrepreneur = await db.Entrepreneur.create({ ...defaultData, ...overrides });
    return entrepreneur;
  } catch (error) {
    console.error('Error creating entrepreneur:', error);
    throw error;
  }
};

const createSite = async (overrides = {}) => {
  const entrepreneur = await createEntrepreneur();
  const defaultData = {
    name: 'Test Site',
    address: '123 Test St',
    entrepreneurId: entrepreneur.id
  };
  return await db.Site.create({ ...defaultData, ...overrides });
};

const createInspectionType = async (overrides = {}) => {
  const defaultData = {
    name: 'Test Inspection Type',
    formStructure: { field1: 'text', field2: 'checkbox' }
  };
  return await db.InspectionType.create({ ...defaultData, ...overrides });
};

const createInspection = async (overrides = {}) => {
  const entrepreneur = await createEntrepreneur();
  const site = await createSite({ entrepreneurId: entrepreneur.id });
  const inspectionType = await createInspectionType({ siteId: site.id });
  const user = await createUser();

  const defaultData = {
    entrepreneurId: entrepreneur.id,
    siteId: site.id,
    inspectionTypeId: inspectionType.id,
    details: { test: 'data' },
    status: 'pending',
    userId: user.id
  };

  return await db.Inspection.create({ ...defaultData, ...overrides });
};

const createFault = async (overrides = {}) => {
  const site = await createSite();
  const inspectionType = await createInspectionType({ siteId: site.id });
  const defaultData = {
    siteId: site.id,
    inspectionTypeId: inspectionType.id,
    parameter: 'Test Parameter',
    status: 'open'
  };
  return await db.Fault.create({ ...defaultData, ...overrides });
};

module.exports = {
  clearDatabase,
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType,
  createInspection,
  createFault
};