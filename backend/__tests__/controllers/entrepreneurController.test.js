const request = require('supertest');
const { app } = require('../../src/server');
const db = require('../../src/models');
const {

  createUser,
  createEntrepreneur
} = require('../fixtures/db');
const { generateTestToken } = require('../../src/utils/authHelpers');

describe('Entrepreneur Controller', () => {
  let adminToken;

  beforeEach(async () => {
    
    const adminUser = await createUser({ role: 'admin' });
    adminToken = generateTestToken(adminUser.id, 'admin');
  });

  describe('POST /api/entrepreneurs', () => {
    it('should create a new entrepreneur', async () => {
      const response = await request(app)
        .post('/api/entrepreneurs')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Entrepreneur',
          contactPerson: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890'
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Entrepreneur');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/entrepreneurs')
        .set('x-auth-token', adminToken)
        .send({
          name: 'Test Entrepreneur'
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/entrepreneurs', () => {
    it('should get all entrepreneurs', async () => {
      await createEntrepreneur();
      await createEntrepreneur({ name: 'Another Entrepreneur' });

      const response = await request(app)
        .get('/api/entrepreneurs')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/entrepreneurs/:id', () => {
    it('should get a specific entrepreneur', async () => {
      const entrepreneur = await createEntrepreneur();

      const response = await request(app)
        .get(`/api/entrepreneurs/${entrepreneur.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(entrepreneur.id);
    });

    it('should return 404 if entrepreneur not found', async () => {
      const response = await request(app)
        .get('/api/entrepreneurs/999')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/entrepreneurs/:id', () => {
    it('should update an entrepreneur', async () => {
      const entrepreneur = await createEntrepreneur();

      const response = await request(app)
        .put(`/api/entrepreneurs/${entrepreneur.id}`)
        .set('x-auth-token', adminToken)
        .send({
          name: 'Updated Entrepreneur',
          contactPerson: 'Jane Doe'
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Entrepreneur');
      expect(response.body.contactPerson).toBe('Jane Doe');
    });
  });

  describe('DELETE /api/entrepreneurs/:id', () => {
    it('should delete an entrepreneur', async () => {
      const entrepreneur = await createEntrepreneur();

      const response = await request(app)
        .delete(`/api/entrepreneurs/${entrepreneur.id}`)
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);

      const deletedEntrepreneur = await db.Entrepreneur.findByPk(entrepreneur.id);
      expect(deletedEntrepreneur).toBeNull();
    });
  });
});