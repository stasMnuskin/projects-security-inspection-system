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

describe('Report Controller', () => {
  let adminToken;
  let entrepreneur;
  let site;
  let inspectionType;

  beforeEach(async () => {
    
    const adminUser = await createUser({ role: 'admin' });
    adminToken = generateTestToken(adminUser.id, 'admin');
    entrepreneur = await createEntrepreneur();
    site = await createSite({ entrepreneurId: entrepreneur.id });
    inspectionType = await createInspectionType({ siteId: site.id });
  });

  describe('GET /api/reports/inspections-by-date', () => {
    it('should get inspections by date range', async () => {
      const inspection1 = await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        createdAt: new Date('2023-01-01')
      });
      const inspection2 = await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        createdAt: new Date('2023-06-01')
      });
      
      const start = new Date('2023-01-01')
      const end = new Date('2023-12-31')

      const response = await request(app)
        .get('/api/reports/inspections-by-date')
        .query({ startDate: start, endDate: end })
        .set('x-auth-token', adminToken);

      // console.log("response.body[0].createdAt!!!!!",response.body[0].createdAt)
      // console.log("response.body[1].createdAt",response.body[1].createdAt)

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(new Date(response.body[1].createdAt)).toEqual(inspection1.createdAt);
      expect(new Date(response.body[0].createdAt)).toEqual(inspection2.createdAt);
    });

    it('should return 400 if date range is invalid', async () => {
      const response = await request(app)
        .get('/api/reports/inspections-by-date')
        .query({ startDate: 'invalid-date', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/reports/stats-by-entrepreneur', () => {
    it('should get inspection statistics by entrepreneur', async () => {
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'completed'
      });
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'pending'
      });

      const response = await request(app)
        .get('/api/reports/stats-by-entrepreneur')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].entrepreneurId).toBe(entrepreneur.id);
      expect(response.body[0].totalInspections).toBe(2);
      expect(response.body[0].completedInspections).toBe(1);
    });
  });

  describe('GET /api/reports/status-summary', () => {
    it('should get inspection status summary', async () => {
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'completed'
      });
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'pending'
      });

      const response = await request(app)
        .get('/api/reports/status-summary')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.find(item => item.status === 'completed').count).toBe(1);
      expect(response.body.find(item => item.status === 'pending').count).toBe(1);
    });
  });

  describe('GET /api/reports/csv', () => {
    it('should export inspections to CSV', async () => {
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id
      });

      const response = await request(app)
        .get('/api/reports/csv')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.header['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.text).toContain('ID,Entrepreneur,Site,Inspection Type,Status,Date');
    });
  });

  describe('GET /api/reports/pdf', () => {
    it('should export inspections to PDF', async () => {
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id
      });

      const response = await request(app)
        .get('/api/reports/pdf')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/reports/inspections', () => {
    it('should get detailed inspection report', async () => {
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        createdAt: new Date('2023-01-01')
      });

      const response = await request(app)
        .get('/api/reports/inspections')
        .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(entrepreneur.name);
      expect(response.body[entrepreneur.name]).toHaveProperty(site.name);
      expect(response.body[entrepreneur.name][site.name]).toHaveProperty(inspectionType.name);
      expect(response.body[entrepreneur.name][site.name][inspectionType.name]).toHaveLength(1);
    });
  });
});