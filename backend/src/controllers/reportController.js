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
      throw new AppError('Start date and end date are required', 400, 'BAD_REQUEST').setRequestDetails(req);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400, 'BAD_REQUEST').setRequestDetails(req);
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

    if (!inspections) {
      throw new AppError('inspections not found', 404, 'Inspections_NOT_FOUND').setRequestDetails(req);
    }

    logger.info(`Found inspections: ${inspections.length}`);
    console.timeEnd('getInspectionsByDateRange');
    
    res.json(inspections);
  } catch (error) {
    console.timeEnd('getInspectionsByDateRange');
    logger.error('Error in getInspectionsByDateRange:', error);
    next(error);
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