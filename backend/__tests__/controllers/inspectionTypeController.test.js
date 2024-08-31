const request = require('supertest');
const { app } = require('../../src/server');
const db = require('../../src/models');
const {
  
  createUser,
  createEntrepreneur,
  createSite,
  createInspectionType
} = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Inspection Type Controller', () => {
  let adminToken;
  let site;

  beforeEach(async () => {
    
    const adminUser = await createUser({ role: 'admin' });
    adminToken = generateTestToken(adminUser.id, 'admin');
    const entrepreneur = await createEntrepreneur();
    site = await createSite({ entrepreneurId: entrepreneur.id });
  });

  describe('POST /api/inspection-types', () => {
    it('should create a new inspection type', async () => {
      const response = await request(app)
        .post('/api/inspection-types')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Inspection Type',
          siteId: site.id,
          formStructure: [
            { name: 'field1', type: 'text' },
            { name: 'field2', type: 'checkbox' }
          ],
          frequency: 'daily'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Inspection Type');
      expect(response.body.siteId).toBe(site.id);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/inspection-types')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Inspection Type'
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/inspection-types', () => {
    it('should get all inspection types', async () => {
      await createInspectionType({ siteId: site.id });
      await createInspectionType({ name: 'Another Type', siteId: site.id });

      const response = await request(app)
        .get('/api/inspection-types')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/inspection-types/:id', () => {
    it('should get a specific inspection type', async () => {
      const inspectionType = await createInspectionType({ siteId: site.id });

      const response = await request(app)
        .get(`/api/inspection-types/${inspectionType.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(inspectionType.id);
    });

    it('should return 404 if inspection type not found', async () => {
      const response = await request(app)
        .get('/api/inspection-types/999')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/inspection-types/:id', () => {
    it('should update an inspection type', async () => {
      const inspectionType = await createInspectionType({ siteId: site.id });

      const response = await request(app)
        .put(`/api/inspection-types/${inspectionType.id}`)
        .set('x-auth-token', adminToken)
        .send({
          name: 'Updated Inspection Type',
          formStructure: [
            { name: 'updatedField', type: 'number' }
          ],
          frequency: 'weekly'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Inspection Type');
      expect(response.body.frequency).toBe('weekly');
    });
  });

  describe('DELETE /api/inspection-types/:id', () => {
    it('should delete an inspection type', async () => {
      const inspectionType = await createInspectionType({ siteId: site.id });

      const response = await request(app)
        .delete(`/api/inspection-types/${inspectionType.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);

      const deletedInspectionType = await db.InspectionType.findByPk(inspectionType.id);
      expect(deletedInspectionType).toBeNull();
    });
  });

  describe('GET /api/inspection-types/site/:siteId', () => {
    it('should get all inspection types for a specific site', async () => {
      await createInspectionType({ siteId: site.id });
      await createInspectionType({ name: 'Another Type', siteId: site.id });

      const response = await request(app)
        .get(`/api/inspection-types/site/${site.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].siteId).toBe(site.id);
      expect(response.body[1].siteId).toBe(site.id);
    });

    it('should return 404 if site not found', async () => {
      const response = await request(app)
        .get('/api/inspection-types/site/999')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(404);
    });
  });
});