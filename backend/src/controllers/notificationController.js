const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

let io;

exports.setIo = (socketIo) => {
  io = socketIo;
};

exports.createNotification = async (userId, message, type = 'info') => {
  try {
    const notification = await db.Notification.create({ userId, message, type });
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }
    logger.info(`Function createNotification called with params: ${JSON.stringify(req.params)}`);
    return notification;
  } catch (error) {
    logger.error('Error in createNotification:', error);
    AppError(error);
  }
};

exports.getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await db.Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (!notifications) {
      throw new AppError('notifications not found', 404, 'Notifications_NOT_FOUND').setRequestDetails(req);
    }
    res.json(notifications);
    logger.info(`Function getUserNotifications called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    next(error);
  }
};

exports.markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
      throw new AppError('notification not found', 404, 'Notification_NOT_FOUND').setRequestDetails(req);
    }
    await notification.update({ isRead: true });
    res.json({ message: 'Notification marked as read' });
    logger.info(`Function markNotificationAsRead called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in markNotificationAsRead:', error);
    next(error);
  }
};