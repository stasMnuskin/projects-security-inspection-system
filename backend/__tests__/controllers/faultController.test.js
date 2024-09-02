const request = require('supertest');
const { app } = require('../../src/server');
const db = require('../src/models');
const {
  
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType,
  createFault
} = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Fault Controller', () => {
  let adminToken;
  let site;
  let inspectionType;

  beforeEach(async () => {
    
    const adminUser = await createUser({ role: 'admin' });
    adminToken = generateTestToken(adminUser.id, 'admin');
    const entrepreneur = await createEntrepreneur();
    site = await createSite({ entrepreneurId: entrepreneur.id });
    inspectionType = await createInspectionType({ siteId: site.id });
  });

  describe('POST /api/faults', () => {
    it('should create a new fault', async () => {
      const response = await request(app)
        .post('/api/faults')
        .set('x-auth-token', adminToken)
        .send({
          siteId: site.id,
          inspectionTypeId: inspectionType.id,
          parameter: 'Test Parameter',
          description: 'Test Description',
          severity: 'medium'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.siteId).toBe(site.id);
      expect(response.body.inspectionTypeId).toBe(inspectionType.id);
      expect(response.body.parameter).toBe('Test Parameter');
      expect(response.body.status).toBe('open');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/faults')
        .set('x-auth-token', adminToken)
        .send({
          siteId: site.id
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/faults/:id/close', () => {
    it('should close a fault', async () => {
      const fault = await createFault({ 
        siteId: site.id, 
        inspectionTypeId: inspectionType.id,
        parameter: 'Test Parameter'
      });

      const response = await request(app)
        .put(`/api/faults/${fault.id}/close`)
        .set('x-auth-token', adminToken)
        .send({
          resolutionNotes: 'Fault resolved'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('closed');
      expect(response.body.closedAt).not.toBeNull();
    });

    it('should return 404 if fault not found', async () => {
      const response = await request(app)
        .put('/api/faults/999/close')
        .set('x-auth-token', adminToken)
        .send({
          resolutionNotes: 'Fault resolved'
        });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/faults', () => {
    it('should get faults by date range', async () => {
      const fault1 = await createFault({ createdAt: new Date('2023-01-01') });
      const fault2 = await createFault({ createdAt: new Date('2023-06-01') });
    
      const response = await request(app)
        .get('/api/faults')
        .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);
    
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(fault1.id);
      expect(response.body[1].id).toBe(fault2.id);
    });

    it('should return 400 if date range is invalid', async () => {
      const response = await request(app)
        .get('/api/faults')
        .query({ startDate: 'invalid-date', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(400);
    });
  });
});