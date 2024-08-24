const { Inspection } = require('../models');
const { Op } = require('sequelize');

exports.checkOverdueInspections = async () => {
  const overdueThreshold = new Date();
  overdueThreshold.setDate(overdueThreshold.getDate() - 30);

  const overdueInspections = await Inspection.findAll({
    where: {
      status: 'pending',
      createdAt: {
        [Op.lt]: overdueThreshold
      }
    }
  });

  return overdueInspections;
};

exports.checkCriticalIssues = async () => {
  const criticalIssues = await Inspection.findAll({
    where: {
      status: 'requires_action',
      details: {
        severity: 'high'
      }
    }
  });

  return criticalIssues;
};