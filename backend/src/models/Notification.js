module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'warning', 'error'),
      allowNull: false,
      defaultValue: 'info',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  Notification.associate = function(models) {
    Notification.belongsTo(models.User, { 
      foreignKey: 'userId',
      constraints: false // Allow notifications to keep references to soft-deleted users
    });
  };

  return Notification;
};
