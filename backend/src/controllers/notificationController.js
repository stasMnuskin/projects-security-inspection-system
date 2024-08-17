const db = require('../models');

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
    console.error('Error creating notification:', error);
    throw error;
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
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};