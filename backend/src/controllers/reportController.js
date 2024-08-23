const cache = require('../utils/cache');
const { Op } = require('sequelize');
const { Inspection, Entrepreneur, Site, InspectionType } = require('../models');
const logger = require('../utils/logger');

exports.getInspectionsByDateRange = async (req, res) => {
  console.time('getInspectionsByDateRange');
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
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
    
    logger.info(`Found inspections: ${inspections.length}`);
    console.timeEnd('getInspectionsByDateRange');
    
    res.json(inspections);
  } catch (error) {
    console.timeEnd('getInspectionsByDateRange');
    logger.error('Error in getInspectionsByDateRange:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getInspectionStatsByEntrepreneur = async (req, res) => {
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

      res.json(stats);
  } catch (error) {
    logger.error('Error fetching inspection stats:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getInspectionStatusSummary = async (req, res) => {
  try {
      const summary = await Inspection.findAll({
          attributes: [
              'status',
              [Inspection.sequelize.fn('COUNT', Inspection.sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
      });

      res.json(summary);
  } catch (error) {
    
    logger.error('Error fetching inspection status summary:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.exportInspectionsToCsv = async (req, res) => {
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.exportInspectionsToPdf = async (req, res) => {
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
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};