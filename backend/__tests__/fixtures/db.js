const bcrypt = require('bcrypt');
const db = require('../../src/models');

const clearDatabase = async () => {
  await db.Inspection.destroy({ where: {} });
  await db.InspectionType.destroy({ where: {} });
  await db.Site.destroy({ where: {} });
  await db.Entrepreneur.destroy({ where: {} });
  await db.User.destroy({ where: {} });
};

const createUser = async (data = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    role: 'inspector'
  };
  
  return await db.User.create({ ...defaultData, ...data });
};

const createEntrepreneur = async (overrides = {}) => {
  const defaultData = {
    name: 'Test Entrepreneur',
    contactPerson: 'John Doe',
    phone: '1234567890',
    email: 'entrepreneur@test.com'
  };
  return await db.Entrepreneur.create({ ...defaultData, ...overrides });
};

const createSite = async (overrides = {}) => {
  const defaultData = {
    name: 'Test Site',
    address: '123 Test St'
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
  const defaultData = {
    details: { test: 'data' },
    status: 'pending'
  };
  return await db.Inspection.create({ ...defaultData, ...overrides });
};

module.exports = {
  clearDatabase,
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType,
  createInspection
};