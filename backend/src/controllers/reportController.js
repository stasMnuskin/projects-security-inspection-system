const csv = require('fast-csv');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');

const { Inspection, Entrepreneur, Site, InspectionType } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

const isValidDate = (dateString) => {
  return !isNaN(new Date(dateString).getTime());
};

exports.getInspectionsByDateRange = async (req, res, next) => {
  const startTime = process.hrtime();
  
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return next(new AppError('Start date and end date are required', 400, 'MISSING_DATES'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
      return next(new AppError('Invalid date format', 400, 'INVALID_DATE_FORMAT'));
    }

    const cacheKey = `inspections:${startDate}:${endDate}`;
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      const endTime = process.hrtime(startTime);
      logger.info(`Retrieved inspections from cache in ${endTime[0]}s ${endTime[1] / 1000000}ms`);
      return res.json(JSON.parse(cachedData));
    }

    const inspections = await Inspection.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      attributes: ['id', 'createdAt', 'status', 'entrepreneurId', 'siteId', 'inspectionTypeId'],
      order: [['createdAt', 'DESC']]
    });

    const entrepreneurIds = [...new Set(inspections.map(i => i.entrepreneurId))];
    const siteIds = [...new Set(inspections.map(i => i.siteId))];
    const inspectionTypeIds = [...new Set(inspections.map(i => i.inspectionTypeId))];

    const [entrepreneurs, sites, inspectionTypes] = await Promise.all([
      Entrepreneur.findAll({ where: { id: entrepreneurIds }, attributes: ['id', 'name'] }),
      Site.findAll({ where: { id: siteIds }, attributes: ['id', 'name'] }),
      InspectionType.findAll({ where: { id: inspectionTypeIds }, attributes: ['id', 'name'] })
    ]);

    const entrepreneurLookup = entrepreneurs.reduce((acc, e) => ({ ...acc, [e.id]: e.name }), {});
    const siteLookup = sites.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {});
    const inspectionTypeLookup = inspectionTypes.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});

    const result = inspections.map(inspection => ({
      ...inspection.toJSON(),
      createdAt: new Date(inspection.createdAt).toISOString()
    }));

    await cache.set(cacheKey, JSON.stringify(result), 3600); // 1 hour

    const endTime = process.hrtime(startTime);
    logger.info(`Retrieved inspections from database in ${endTime[0]}s ${endTime[1] / 1000000}ms`);

    res.json(result);
  } catch (error) {
    logger.error('Error fetching inspections:', error);
    next(new AppError('Error fetching inspections', 500, 'INSPECTION_FETCH_ERROR', true, error.stack));
  }
};

exports.getInspectionStatsByEntrepreneur = async (req, res, next) => {
  try {
    const stats = await Inspection.findAll({
      attributes: [
        'entrepreneurId',
        [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('Inspection.id')), 'totalInspections'],
        [Inspection.sequelize.fn('SUM', Inspection.sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedInspections']
      ],
      include: [{ model: Entrepreneur, attributes: ['name'] }],
      group: ['entrepreneurId', 'Entrepreneur.id'],
      raw: true,
      nest: true
    });


      if (!stats) {
        throw new AppError('stats not found', 404, 'STATS_NOT_FOUND').setRequestDetails(req);
      }

      res.json(stats);
      logger.info(`Function called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error fetching inspection stats:', error);
    next(error);
  }
};

exports.getInspectionStatusSummary = async (req, res, next) => {
  try {
      const summary = await Inspection.findAll({
          attributes: [
              'status',
              [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
      });


      if (!summary) {
        throw new AppError('Summary not found', 404, 'Summary_NOT_FOUND').setRequestDetails(req);
      }

      res.json(summary);
      logger.info(`Function called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    
    logger.error('Error fetching inspection status summary:', error);
    next(error)
  }
};

exports.exportInspectionsToCsv = async (req, res, next) => {
  try {
    const inspections = await Inspection.findAll({
      include: [
        { model: Entrepreneur, attributes: ['name'] },
        { model: Site, attributes: ['name'] },
        { model: InspectionType, attributes: ['name'] }
      ],
      raw: true,
      nest: true
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const csvStream = csv.format({ headers: true });
    const writableStream = fs.createWriteStream('inspections.csv');

    csvStream.pipe(writableStream);

    inspections.forEach((inspection) => {
      csvStream.write({
        ID: inspection.id,
        Entrepreneur: inspection.Entrepreneur.name,
        Site: inspection.Site.name,
        'Inspection Type': inspection.InspectionType.name,
        Status: inspection.status,
        Date: inspection.createdAt
      });
    });

    csvStream.end();

    writableStream.on('finish', function() {
      res.download('inspections.csv', () => {
        fs.unlinkSync('inspections.csv');
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.exportInspectionsToPdf = async (req, res, next) => {
  try {
      const inspections = await Inspection.findAll({
          include: [
              { model: Entrepreneur, attributes: ['name'] },
              { model: Site, attributes: ['name'] },
              { model: InspectionType, attributes: ['name'] }
          ],
          raw: true,
          nest: true
      });

      if (!inspections) {
        throw new AppError('Inspections not found', 404, 'Inspections_NOT_FOUND').setRequestDetails(req);
      }

      const doc = new PDFDocument();
      let filename = 'inspections.pdf';
      res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
      res.setHeader('Content-type', 'application/pdf');
      res.status(200);
      doc.pipe(res);

      doc.fontSize(20).text('Inspections Report', { align: 'center' });
      doc.moveDown();

      inspections.forEach((inspection, index) => {
          doc.fontSize(12).text(`Inspection ${index + 1}:`);
          doc.fontSize(10).text(`Entrepreneur: ${inspection.Entrepreneur.name}`);
          doc.text(`Site: ${inspection.Site.name}`);
          doc.text(`Type: ${inspection.InspectionType.name}`);
          doc.text(`Status: ${inspection.status}`);
          doc.text(`Date: ${inspection.createdAt}`);
          doc.moveDown();
      });

      doc.end();
  } catch (error) {
    logger.error('Error exporting inspections to PDF:', error);
    next(error);
  }
};

exports.getInspectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const inspections = await Inspection.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        { model: Entrepreneur },
        { model: Site },
        { model: InspectionType }
      ]
    });
    
    const report = inspections.reduce((acc, inspection) => {
      const entrepreneur = inspection.Entrepreneur.name;
      const site = inspection.Site.name;
      const inspectionType = inspection.InspectionType.name;
      
      if (!acc[entrepreneur]) acc[entrepreneur] = {};
      if (!acc[entrepreneur][site]) acc[entrepreneur][site] = {};
      if (!acc[entrepreneur][site][inspectionType]) acc[entrepreneur][site][inspectionType] = [];
      
      acc[entrepreneur][site][inspectionType].push(inspection);
      
      return acc;
    }, {});
    
    logger.info('Inspection report generated');
    res.json(report);
  } catch (error) {
    logger.error('Error generating inspection report:', error);
    next(new AppError('Error generating inspection report', 500));
  }
};