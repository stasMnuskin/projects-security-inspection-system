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

describe('Analytics Controller', () => {
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

  describe('GET /api/analytics/statistics', () => {
    it('should get general statistics', async () => {
      const adminUser = await createUser({ role: 'admin' });
      const adminToken = generateTestToken(adminUser.id, 'admin');
    
      const response = await request(app)
        .get('/api/analytics/statistics')
        .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);
    
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalInspections', 2);
      expect(response.body).toHaveProperty('completedInspections', 1);
      expect(response.body).toHaveProperty('pendingInspections', 1);
      expect(response.body).toHaveProperty('averageCompletionTime');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('performance');
    });

    it('should return 400 if date range is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/statistics')
        .query({ startDate: 'invalid-date', endDate: '2023-12-31' })
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/analytics/alerts', () => {
    it('should get analytics alerts', async () => {
      // Create an overdue inspection
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 31);  // 31 days ago
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'pending',
        createdAt: overdueDate
      });

      // Create a critical issue
      await createInspection({
        entrepreneurId: entrepreneur.id,
        siteId: site.id,
        inspectionTypeId: inspectionType.id,
        status: 'requires_action',
        details: { severity: 'high' },
        createdAt: new Date()
      });

      const response = await request(app)
        .get('/api/analytics/alerts')
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('overdueInspections');
      expect(response.body.overdueInspections).toHaveLength(1);
      expect(response.body).toHaveProperty('criticalIssues');
      expect(response.body.criticalIssues).toHaveLength(1);
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Simulating an internal error by passing an invalid date
      const response = await request(app)
        .get('/api/analytics/statistics')
        .query({ startDate: 'invalid-date', endDate: 'also-invalid' })
        .set('x-auth-token', adminToken);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid date range');
    });
  });

  describe('Authorization', () => {
    it('should prevent access for non-admin users', async () => {
      const nonAdminUser = await createUser({ role: 'inspector' });
      const nonAdminToken = generateTestToken(nonAdminUser.id, 'inspector');
      
      const response = await request(app)
        .get('/api/analytics/statistics')
        .query({ startDate: '2023-01-01', endDate: '2023-12-31' })
        .set('x-auth-token', nonAdminToken);
    
      expect(response.statusCode).toBe(403);
    });
  });
});