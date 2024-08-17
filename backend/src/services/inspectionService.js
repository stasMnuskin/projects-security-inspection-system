const { Inspection, Entrepreneur, Site, InspectionType } = require('../models');
const AppError = require('../utils/appError');

exports.createInspection = async (inspectionData, userId) => {
  const { entrepreneurId, siteId, inspectionTypeId, details } = inspectionData;

  // בדיקת קיום הישויות הקשורות
  const [entrepreneur, site, inspectionType] = await Promise.all([
    Entrepreneur.findByPk(entrepreneurId),
    Site.findByPk(siteId),
    InspectionType.findByPk(inspectionTypeId)
  ]);

  if (!entrepreneur) throw new AppError('Entrepreneur not found', 404);
  if (!site) throw new AppError('Site not found', 404);
  if (!inspectionType) throw new AppError('Inspection type not found', 404);

  // בדיקה שהאתר שייך ליזם
  if (site.entrepreneurId !== entrepreneurId) {
    throw new AppError('Site does not belong to the specified entrepreneur', 400);
  }

  return Inspection.create({
    entrepreneurId,
    siteId,
    inspectionTypeId,
    details,
    userId
  });
};