const { Inspection, Entrepreneur, Site, InspectionType, User, Fault, InspectionFault } = require('../models');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

exports.createInspection = async (inspectionData, userId) => {
  const { entrepreneurId, siteId, inspectionTypeId, details } = inspectionData;

  const [entrepreneur, site, inspectionType] = await Promise.all([
    Entrepreneur.findByPk(entrepreneurId),
    Site.findByPk(siteId),
    InspectionType.findByPk(inspectionTypeId)
  ]);

  if (!entrepreneur) throw new AppError('Entrepreneur not found', 404);
  if (!site) throw new AppError('Site not found', 404);
  if (!inspectionType) throw new AppError('Inspection type not found', 404);

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

exports.getInspectionById = async (id, userId, userRole) => {
  const whereClause = getWhereClauseForUser(userId, userRole);
  const inspection = await Inspection.findOne({
    where: {
      id,
      ...whereClause
    },
    include: [
      { model: Entrepreneur },
      { model: Site },
      { model: InspectionType },
      { model: User }
    ]
  });

  if (!inspection) {
    throw new AppError('Inspection not found or access denied', 404);
  }

  return inspection;
};


exports.updateInspection = async (id, updateData, userId, userRole) => {
  const whereClause = getWhereClauseForUser(userId, userRole);
  const inspection = await Inspection.findOne({
    where: {
      id,
      ...whereClause
    }
  });

  if (!inspection) {
    throw new AppError('Inspection not found or access denied', 404);
  }

  Object.assign(inspection, updateData);
  await inspection.save();

  return inspection;
};

exports.deleteInspection = async (id, userId, userRole) => {
  const whereClause = getWhereClauseForUser(userId, userRole);
  const inspection = await Inspection.findOne({
    where: {
      id,
      ...whereClause
    }
  });

  if (!inspection) {
    throw new AppError('Inspection not found or access denied', 404);
  }

  await inspection.destroy();
};

exports.getControlCenterDrillSuccess = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const drills = await Inspection.findAll({
      where: {
        ...whereClause,
        type: 'drill',
      },
      include: [{
        model: Site,
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'date', 'result', 'notes'],
      order: [['date', 'DESC']],
      limit: 10
    });

    return drills;
  } catch (error) {
    throw new AppError('Failed to fetch control center drill success data', 500);
  }
};

exports.getOfficialInspectionRemarks = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const officialInspections = await Inspection.findAll({
      where: {
        ...whereClause,
        type: {
          [Op.in]: ['ministry_of_energy', 'police']
        }
      },
      include: [{
        model: Site,
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'date', 'type', 'notes'],
      order: [['date', 'DESC']],
      limit: 10
    });

    return officialInspections;
  } catch (error) {
    throw new AppError('Failed to fetch official inspection remarks', 500);
  }
};

exports.getSitesWithSignificantFaults = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const sites = await Site.findAll({
      where: whereClause,
      include: [{
        model: Fault,
        where: { severity: 'high', status: 'open' },
        required: true
      }],
      attributes: ['id', 'name'],
      group: ['Site.id', 'Faults.id'],
      having: Inspection.sequelize.literal('COUNT(Faults.id) > 0')
    });
    return sites;
  } catch (error) {
    throw new AppError('Failed to get sites with significant faults', 500);
  }
};

exports.getRecurringFaults = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const faults = await Fault.findAll({
      include: [{
        model: Site,
        where: whereClause,
        attributes: ['id', 'name']
      }],
      attributes: [
        'description',
        [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('Fault.id')), 'occurrences']
      ],
      group: ['Fault.description', 'Site.id'],
      having: Inspection.sequelize.literal('COUNT(Fault.id) > 1'),
      order: [[Inspection.sequelize.literal('occurrences'), 'DESC']],
      limit: 10
    });
    return faults;
  } catch (error) {
    throw new AppError('Failed to get recurring faults', 500);
  }
};

exports.getSiteWithMostOpenFaults = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const site = await Site.findOne({
      where: whereClause,
      include: [{
        model: Fault,
        where: { status: 'open' },
        required: true
      }],
      attributes: [
        'id',
        'name',
        [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('Faults.id')), 'faultCount']
      ],
      group: ['Site.id'],
      order: [[Inspection.sequelize.literal('faultCount'), 'DESC']]
    });
    return site;
  } catch (error) {
    throw new AppError('Failed to get site with most open faults', 500);
  }
};


exports.getAllInspections = async (userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const inspections = await Inspection.findAll({
      where: whereClause,
      include: [
        { model: Site, attributes: ['id', 'name'] },
        { model: InspectionType, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return inspections;
  } catch (error) {
    throw new AppError('Failed to fetch all inspections', 500);
  }
};

exports.getLatestInspection = async (siteId, userId, userRole) => {
  try {
    const whereClause = getWhereClauseForUser(userId, userRole);
    const latestInspection = await Inspection.findOne({
      where: { ...whereClause, siteId },
      include: [
        { model: Site, attributes: ['id', 'name'] },
        { model: InspectionType, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    if (!latestInspection) {
      throw new AppError('No inspection found for this site', 404);
    }
    
    return latestInspection;
  } catch (error) {
    throw new AppError('Failed to fetch latest inspection', 500);
  }
};

exports.getInspectionFormStructure = async (inspectionTypeId) => {
  try {
    const inspectionType = await InspectionType.findByPk(inspectionTypeId);
    if (!inspectionType) {
      throw new AppError('Inspection type not found', 404);
    }
    return JSON.parse(inspectionType.formStructure);
  } catch (error) {
    throw new AppError('Failed to fetch inspection form structure', 500);
  }
};

const getWhereClauseForUser = (userId, userRole) => {
  if (userRole === 'admin' || userRole === 'security_officer') {
    return {};
  } else if (userRole === 'entrepreneur') {
    return { entrepreneurId: userId };
  }
  throw new AppError('Invalid user role', 403);
};

module.exports = exports;
