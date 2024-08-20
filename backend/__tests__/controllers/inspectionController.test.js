const request = require('supertest');
const { app } = require('../../src/server');
const { clearDatabase, createUser, createEntrepreneur, createSite, createInspectionType } = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Inspection Controller', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should get inspections by date range', async () => {
    const user = await createUser();
    const entrepreneur = await createEntrepreneur();
    const site = await createSite({ entrepreneurId: entrepreneur.id });
    const inspectionType = await createInspectionType({ siteId: site.id });
    const inspection = await createInspection({
      entrepreneurId: entrepreneur.id,
      siteId: site.id,
      inspectionTypeId: inspectionType.id,
      userId: user.id,
      details: {},
      status: 'completed',
      createdAt: new Date('2023-06-15') // תאריך בטווח הבדיקה
    });
  
    console.log('Created inspection:', inspection);
  
    const token = generateTestToken(user.id);
  
    const response = await request(app)
      .get('/api/reports/inspections-by-date')
      .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
      .set('x-auth-token', token);
  
    console.log('Response body:', response.body);
  
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  }, 10000);

  // בדיקות נוספות...
});