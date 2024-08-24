const statisticsService = require('../services/statisticsService');
const alertService = require('../services/alertService');
const AppError = require('../utils/appError');

exports.getStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    const stats = await statisticsService.getInspectionStatistics(new Date(startDate), new Date(endDate));
    const performance = await statisticsService.getInspectorPerformance(new Date(startDate), new Date(endDate));
    if (!stats || !performance) {
      throw new AppError('Stats or performance error', 400, 'BAD_REQUEST').setRequestDetails(req);
    }
    res.json({ stats, performance });
  } catch (error) {
    next(error);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const overdueInspections = await alertService.checkOverdueInspections();
    const criticalIssues = await alertService.checkCriticalIssues();
    if (!overdueInspections || !criticalIssues) {
      throw new AppError('getAlerts', 400, 'BAD_REQUEST').setRequestDetails(req);
    }
    res.json({ overdueInspections, criticalIssues });
  } catch (error) {
    next(error);
  }
};