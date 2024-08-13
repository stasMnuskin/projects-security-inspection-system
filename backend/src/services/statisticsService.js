const { sequelize, Inspection, User } = require('../models');
const { Op } = require('sequelize');

exports.getInspectionStatistics = async (startDate, endDate) => {
  const stats = await Inspection.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    },
    group: ['status']
  });

  return stats;
};

exports.getInspectorPerformance = async (startDate, endDate) => {
  const performance = await Inspection.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('Inspection.id')), 'inspectionCount']
    ],
    include: [{
      model: User,
      attributes: ['id', 'username'],
      where: { role: 'inspector' }
    }],
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    },
    group: ['User.id', 'User.username']
  });

  return performance;
};