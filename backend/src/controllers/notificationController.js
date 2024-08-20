const db = require('../models');
const errorHandler = require('../utils/appError');

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
    return notification;
  } catch (error) {
    errorHandler(error);
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await db.Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    errorHandler(error);
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await notification.update({ isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    errorHandler(error);
  }
};