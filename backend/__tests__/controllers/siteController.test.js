const request = require('supertest');
const { app } = require('../../src/server');
const { Site } = require('../../src/models');
const {
  clearDatabase,
  createUser,
  createEntrepreneur,
  createSite
} = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Site Controller', () => {
  let adminToken;
  let entrepreneur;

  beforeEach(async () => {
    await clearDatabase();
    const adminUser = await createUser({ role: 'admin' });
    adminToken = generateTestToken(adminUser.id, 'admin');
    entrepreneur = await createEntrepreneur();
  });

  describe('POST /api/sites', () => {
    it('should create a new site', async () => {
      const response = await request(app)
        .post('/api/sites')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Site',
          address: '123 Test St',
          entrepreneurId: entrepreneur.id
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Site');
      expect(response.body.entrepreneurId).toBe(entrepreneur.id);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/sites')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Site'
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/sites', () => {
    it('should get all sites', async () => {
      await createSite({ entrepreneurId: entrepreneur.id });
      await createSite({ name: 'Another Site', entrepreneurId: entrepreneur.id });

      const response = await request(app)
        .get('/api/sites')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/sites/:id', () => {
    it('should get a specific site', async () => {
      const site = await createSite({ entrepreneurId: entrepreneur.id });

      const response = await request(app)
        .get(`/api/sites/${site.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(site.id);
    });

    it('should return 404 if site not found', async () => {
      const response = await request(app)
        .get('/api/sites/999')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/sites/:id', () => {
    it('should update a site', async () => {
      const site = await createSite({ entrepreneurId: entrepreneur.id });

      const response = await request(app)
        .put(`/api/sites/${site.id}`)
        .set('x-auth-token', adminToken)
        .send({
          name: 'Updated Site',
          address: '456 Update Ave'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Site');
      expect(response.body.address).toBe('456 Update Ave');
    });
  });

  describe('DELETE /api/sites/:id', () => {
    it('should delete a site', async () => {
      const site = await createSite({ entrepreneurId: entrepreneur.id });

      const response = await request(app)
        .delete(`/api/sites/${site.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);

      const deletedSite = await Site.findByPk(site.id);
      expect(deletedSite).toBeNull();
    });
  });

  describe('GET /api/sites/entrepreneur/:entrepreneurId', () => {
    it('should get all sites for a specific entrepreneur', async () => {
      await createSite({ entrepreneurId: entrepreneur.id });
      await createSite({ name: 'Another Site', entrepreneurId: entrepreneur.id });

      const response = await request(app)
        .get(`/api/sites/entrepreneur/${entrepreneur.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].entrepreneurId).toBe(entrepreneur.id);
      expect(response.body[1].entrepreneurId).toBe(entrepreneur.id);
    });

    it('should return 404 if entrepreneur not found', async () => {
      const response = await request(app)
        .get('/api/sites/entrepreneur/999')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(404);
    });
  });
});