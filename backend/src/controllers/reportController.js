const { Op } = require('sequelize');
const db = require('../models');

exports.getInspectionsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const inspections = await db.Inspection.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            include: [
                { model: db.Entrepreneur },
                { model: db.Site },
                { model: db.InspectionType }
            ]
        });

        res.json(inspections);
    } catch (error) {
        console.error('Error fetching inspections by date range:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getInspectionStatsByEntrepreneur = async (req, res) => {
    try {
        const stats = await db.Inspection.findAll({
            attributes: [
                'entrepreneurId',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalInspections'],
                [db.sequelize.fn('AVG', db.sequelize.col('id')), 'averageInspectionsPerSite']
            ],
            include: [
                { 
                    model: db.Entrepreneur,
                    attributes: ['name']
                }
            ],
            group: ['entrepreneurId', 'Entrepreneur.id'],
            raw: true
        });

        res.json(stats);
    } catch (error) {
        console.error('Error fetching inspection stats by entrepreneur:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getInspectionStatusSummary = async (req, res) => {
    try {
        const summary = await db.Inspection.findAll({
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        res.json(summary);
    } catch (error) {
        console.error('Error fetching inspection status summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};