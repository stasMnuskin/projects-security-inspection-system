const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Site = sequelize.define('Site', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  Site.associate = (models) => {
    Site.belongsTo(models.Entrepreneur, { foreignKey: 'entrepreneurId' });
    Site.hasMany(models.InspectionType, { foreignKey: 'siteId' });
  };

  return Site;
};