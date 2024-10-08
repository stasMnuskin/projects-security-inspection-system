const { Site, Entrepreneur, Fault, User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createSite = async (req, res, next) => {
  try {
    const { name, address, entrepreneurId } = req.body;

    if (!name || !entrepreneurId) {
      return next(new AppError('Name and entrepreneurId are required', 400));
    }

    const entrepreneur = await Entrepreneur.findByPk(entrepreneurId);
    if (!entrepreneur) {
      return next(new AppError('Entrepreneur not found', 404));
    }

    const site = await Site.create({
      name,
      address,
      entrepreneurId
    });

    logger.info(`New site created: ${name}`);
    res.status(201).json(site);
  } catch (error) {
    logger.error('Error in createSite:', error);
    return next(new AppError('Error creating site', 500));
  }
};

exports.getAllSites = async (req, res, next) => {
  try {
    const sites = await Site.findAll({
      include: [{
        model: User,
        as: 'entrepreneur',
        attributes: ['id', 'username', 'email']
      }]
    });
    res.json(sites);
  } catch (error) {
    logger.error('Error in getAllSites:', error);
    next(new AppError('Error fetching sites', 500));
  }
};

exports.getSiteById = async (req, res, next) => {
  try {
    const site = await Site.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'entrepreneur',
        attributes: ['id', 'username', 'email']
      }]
    });
    if (!site) {
      return next(new AppError('Site not found', 404));
    }
    res.json(site);
  } catch (error) {
    logger.error('Error in getSiteById:', error);
    next(new AppError('Error fetching site', 500));
  }
};

exports.getSitesByAuthenticatedEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneurId = req.user.id;
    logger.info(`Fetching sites for authenticated entrepreneur: ${entrepreneurId}`);

    const sites = await Site.findAll({
      where: { entrepreneurId: entrepreneurId },
      include: [{
        model: User,
        as: 'entrepreneur',
        attributes: ['id', 'username', 'email']
      }]
    });
    
    logger.info(`Found ${sites.length} sites for authenticated entrepreneur ${entrepreneurId}`);
    res.json(sites);
  } catch (error) {
    logger.error(`Error in getSitesByAuthenticatedEntrepreneur:`, error);
    next(new AppError('Error fetching sites', 500, 'FETCH_SITES_ERROR'));
  }
};

exports.getSitesByEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneurId = req.params.entrepreneurId;
    logger.info(`Fetching sites for entrepreneur: ${entrepreneurId}`);

    const sites = await Site.findAll({
      where: { entrepreneurId: entrepreneurId },
      include: [{
        model: User,
        as: 'entrepreneur',
        attributes: ['id', 'username', 'email']
      }]
    });
    
    logger.info(`Found ${sites.length} sites for entrepreneur ${entrepreneurId}`);
    res.json(sites);
  } catch (error) {
    logger.error(`Error in getSitesByEntrepreneur:`, error);
    next(new AppError('Error fetching sites', 500, 'FETCH_SITES_ERROR'));
  }
};

exports.updateSite = async (req, res, next) => {
  try {
    const { name, address, entrepreneurId } = req.body;
    const site = await Site.findByPk(req.params.id);
    if (!site) {
      return next(new AppError('Site not found', 404));
    }

    if (name) site.name = name;
    if (address) site.address = address;

    if (entrepreneurId) {
      const entrepreneur = await Entrepreneur.findByPk(entrepreneurId);
      if (!entrepreneur) {
        return next(new AppError('Entrepreneur not found', 404));
      }
      site.entrepreneurId = entrepreneurId;
    }

    await site.save();

    logger.info(`Site updated: ${site.name}`);
    res.json(site);
  } catch (error) {
    logger.error('Error in updateSite:', error);
    next(new AppError('Error updating site', 500));
  }
};

exports.deleteSite = async (req, res, next) => {
  try {
    const site = await Site.findByPk(req.params.id);
    if (!site) {
      return next(new AppError('Site not found', 404));
    }

    await site.destroy();
    logger.info(`Site deleted: ${site.name}`);
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteSite:', error);
    next(new AppError('Error deleting site', 500));
  }
};

exports.getFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const site = await Site.findOne({
      where: { id: siteId, entrepreneurId: req.user.id }
    });

    if (!site) {
      return next(new AppError('Site not found or access denied', 404));
    }

    const faults = await Fault.findAll({
      where: { siteId: siteId },
      order: [['reportedTime', 'DESC']]
    });
    res.json(faults);
  } catch (error) {
    next(new AppError('Error fetching faults', 500));
  }
};