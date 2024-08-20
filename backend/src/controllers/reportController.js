const { Op } = require('sequelize');
const db = require('../models');
const cache = require('../utils/cache');

exports.getInspectionsByDateRange = async (req, res) => {
  console.time('getInspectionsByDateRange');
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const cacheKey = `inspections:${startDate}:${endDate}`;
    
    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.timeEnd('getInspectionsByDateRange');
      return res.json(cachedData);
    }
    
    const inspections = await db.Inspection.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        { model: db.Entrepreneur, attributes: ['name'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ]
    });
    
    // Cache the result
    await cache.set(cacheKey, inspections);
    
    console.log('Found inspections:', inspections.length);
    console.timeEnd('getInspectionsByDateRange');
    
    res.json(inspections);
  } catch (error) {
    console.timeEnd('getInspectionsByDateRange');
    console.error('Error in getInspectionsByDateRange:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};