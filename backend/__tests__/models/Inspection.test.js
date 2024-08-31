const db = require('../../src/models');
const { createUser, createEntrepreneur, createSite, createInspectionType } = require('../fixtures/db');

describe('Inspection Model', () => {
  
  it('should create an inspection', async () => {
    const user = await createUser();
    const entrepreneur = await createEntrepreneur();
    const site = await createSite({ entrepreneurId: entrepreneur.id });
    const inspectionType = await createInspectionType({ siteId: site.id });

    const inspection = await db.Inspection.create({
      entrepreneurId: entrepreneur.id,
      siteId: site.id,
      inspectionTypeId: inspectionType.id,
      details: { test: 'data' },
      status: 'pending',
      userId: user.id
    });

    expect(inspection).toBeDefined();
    expect(inspection.id).toBeDefined();
    expect(inspection.entrepreneurId).toBe(entrepreneur.id);
    expect(inspection.siteId).toBe(site.id);
    expect(inspection.inspectionTypeId).toBe(inspectionType.id);
    expect(inspection.details).toEqual({ test: 'data' });
    expect(inspection.status).toBe('pending');
    expect(inspection.userId).toBe(user.id);
  });

  it('should not create an inspection without required fields', async () => {
    await expect(db.Inspection.create({})).rejects.toThrow();
  });

  // בדיקות נוספות...
});