module.exports = (sequelize, DataTypes) => {
  const SiteNotificationRecipients = sequelize.define('SiteNotificationRecipients', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sites',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'SiteNotificationRecipients',
    indexes: [
      {
        unique: true,
        fields: ['siteId', 'userId']
      }
    ]
  });

  SiteNotificationRecipients.associate = function(models) {
    SiteNotificationRecipients.belongsTo(models.Site, {
      foreignKey: 'siteId'
    });
    SiteNotificationRecipients.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  };

  return SiteNotificationRecipients;
};
