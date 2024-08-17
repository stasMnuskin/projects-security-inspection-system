const statisticsService = require('../services/statisticsService');
const alertService = require('../services/alertService');

exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    const stats = await statisticsService.getInspectionStatistics(new Date(startDate), new Date(endDate));
    const performance = await statisticsService.getInspectorPerformance(new Date(startDate), new Date(endDate));
    
    res.json({ stats, performance });
  } catch (error) {
    next(error);
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const overdueInspections = await alertService.checkOverdueInspections();
    const criticalIssues = await alertService.checkCriticalIssues();
    
    res.json({ overdueInspections, criticalIssues });
  } catch (error) {
    next(error);
  }
};