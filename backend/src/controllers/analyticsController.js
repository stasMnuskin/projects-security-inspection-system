const statisticsService = require('../services/statisticsService');
const alertService = require('../services/alertService');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getStatistics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Access denied', 403, 'FORBIDDEN'));
    }
    
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
      return next(new AppError('Invalid date range', 400, 'INVALID_DATE_RANGE'));
    }
    
    const stats = await statisticsService.getInspectionStatistics(new Date(startDate), new Date(endDate));
    const performance = await statisticsService.getInspectorPerformance(new Date(startDate), new Date(endDate));
    
    const totalInspections = stats.reduce((sum, stat) => sum + (stat.count || 0), 0);
    const completedInspections = stats.find(s => s.status === 'completed')?.count || 0;
    const pendingInspections = stats.find(s => s.status === 'pending')?.count || 0;
    const averageCompletionTime = calculateAverageCompletionTime(stats);

    res.json({ 
      totalInspections,
      completedInspections,
      pendingInspections,
      averageCompletionTime,
      stats,
      performance
    });
  } catch (error) {
    next(error);
  }
};

function calculateAverageCompletionTime(stats) {
  return 60; 
}

function isValidDate(dateString) {
  return !isNaN(new Date(dateString).getTime());
}

exports.getAlerts = async (req, res, next) => {
  try {
    const overdueInspections = await alertService.checkOverdueInspections();
    const criticalIssues = await alertService.checkCriticalIssues();
    if (!overdueInspections || !criticalIssues) {
      throw new AppError('getAlerts', 400, 'BAD_REQUEST').setRequestDetails(req);
    }
    res.json({ overdueInspections, criticalIssues });
    logger.info(`Function getAlerts called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getAlerts:', error);
    next(error);
  }
};