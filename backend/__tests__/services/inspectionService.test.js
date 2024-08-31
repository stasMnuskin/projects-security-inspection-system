const { createInspection } = require('../../src/services/inspectionService');
const db = require('../../src/models');
const AppError = require('../../src/utils/appError');

jest.mock('../../src/models');


describe('Inspection Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInspection', () => {
    const validInspectionData = {
      entrepreneurId: 1,
      siteId: 1,
      inspectionTypeId: 1,
      details: { test: 'data' }
    };
    const userId = 1;

    it('should create a new inspection when all data is valid', async () => {
      db.Entrepreneur.findByPk = jest.fn().mockResolvedValue({ id: 1 });
      db.Site.findByPk = jest.fn().mockResolvedValue({ id: 1, entrepreneurId: 1 });
      db.InspectionType.findByPk = jest.fn().mockResolvedValue({ id: 1 });
      db.Inspection.create = jest.fn().mockResolvedValue({ id: 1, ...validInspectionData });

      const result = await createInspection(validInspectionData, userId);

      expect(result).toHaveProperty('id');
      expect(db.Inspection.create).toHaveBeenCalledWith({
        ...validInspectionData,
        userId
      });
    });

    it('should throw an error if entrepreneur is not found', async () => {
      db.Entrepreneur.findByPk = jest.fn().mockResolvedValue(null);

      await expect(createInspection(validInspectionData, userId))
        .rejects
        .toThrow(AppError);
    });

    it('should throw an error if site is not found', async () => {
      db.Entrepreneur.findByPk = jest.fn().mockResolvedValue({ id: 1 });
      db.Site.findByPk = jest.fn().mockResolvedValue(null);

      await expect(createInspection(validInspectionData, userId))
        .rejects
        .toThrow(AppError);
    });

    it('should throw an error if inspection type is not found', async () => {
      db.Entrepreneur.findByPk = jest.fn().mockResolvedValue({ id: 1 });
      db.Site.findByPk = jest.fn().mockResolvedValue({ id: 1, entrepreneurId: 1 });
      db.InspectionType.findByPk = jest.fn().mockResolvedValue(null);

      await expect(createInspection(validInspectionData, userId))
        .rejects
        .toThrow(AppError);
    });

    it('should throw an error if site does not belong to the specified entrepreneur', async () => {
      db.Entrepreneur.findByPk = jest.fn().mockResolvedValue({ id: 1 });
      db.Site.findByPk = jest.fn().mockResolvedValue({ id: 1, entrepreneurId: 2 });
      db.InspectionType.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      await expect(createInspection(validInspectionData, userId))
        .rejects
        .toThrow(AppError);
    });
  });
});