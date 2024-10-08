process.env.JWT_SECRET = 'test'

const request = require('supertest');
const { app } = require('../../src/server');
const {
  
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType,
  createInspection
} = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Inspection Controller', () => {

  it('should get inspections by date range', async () => {
    const user = await createUser({ role: 'admin' });
    const entrepreneur = await createEntrepreneur();
    const site = await createSite({ entrepreneurId: entrepreneur.id });
    const inspectionType = await createInspectionType({ siteId: site.id });
    
    const testDate = new Date('2023-06-15');
    const inspection = await createInspection({
      entrepreneurId: entrepreneur.id,
      siteId: site.id,
      inspectionTypeId: inspectionType.id,
      userId: user.id,
      createdAt: testDate
    });

    const token = generateTestToken(user.id, user.role);

    const response = await request(app)
      .get('/api/reports/inspections-by-date')
      .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
      .set('x-auth-token', token);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  }, 10000);
});