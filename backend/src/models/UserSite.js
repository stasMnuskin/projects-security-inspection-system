module.exports = (sequelize, DataTypes) => {
  const UserSite = sequelize.define('UserSite', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sites',
        key: 'id'
      }
    }
  });
  UserSite.associate = function(models) {
    UserSite.belongsTo(models.Site);
  };
  return UserSite;
};