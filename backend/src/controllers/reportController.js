const cache = require('../utils/cache');
const { Op } = require('sequelize');
const { Inspection, Entrepreneur, Site, InspectionType } = require('../models');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

exports.getInspectionsByDateRange = async (req, res, next) => {
  console.time('getInspectionsByDateRange');
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return next(new AppError('Start date and end date are required', 400, 'MISSING_DATES'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format', 400, 'INVALID_DATE_FORMAT'));
    }

    const inspections = await Inspection.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [
        { model: Entrepreneur, attributes: ['name'] },
        { model: Site, attributes: ['name'] },
        { model: InspectionType, attributes: ['name'] }
      ]
    });
    
    // console.timeEnd('getInspectionsByDateRange');
    
    res.json(inspections);
  } catch (error) {
    console.timeEnd('getInspectionsByDateRange');
    next(new AppError('Error fetching inspections', 500, 'INSPECTION_FETCH_ERROR', true, error.stack));
  }
};

exports.getInspectionStatsByEntrepreneur = async (req, res, next) => {
  try {
      const stats = await Inspection.findAll({
          attributes: [
              'entrepreneurId',
              [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('id')), 'totalInspections'],
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


      if (!inspections) {
        throw new AppError('Inspections not found', 404, 'Inspections_NOT_FOUND').setRequestDetails(req);
      }

      const csvWriter = csv({
          path: 'inspections.csv',
          header: [
              { id: 'id', title: 'ID' },
              { id: 'Entrepreneur.name', title: 'Entrepreneur' },
              { id: 'Site.name', title: 'Site' },
              { id: 'InspectionType.name', title: 'Inspection Type' },
              { id: 'status', title: 'Status' },
              { id: 'createdAt', title: 'Date' }
          ]
      });

      await csvWriter.writeRecords(inspections);

      res.download('inspections.csv', () => {
          fs.unlinkSync('inspections.csv');
      });
  } catch (error) {
    logger.error('Error exporting inspections to CSV:', error);
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