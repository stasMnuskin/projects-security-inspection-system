const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inspection = sequelize.define('Inspection', {
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'pending'
    }
  });

  Inspection.associate = (models) => {
    Inspection.belongsTo(models.Entrepreneur, { foreignKey: 'entrepreneurId' });
    Inspection.belongsTo(models.Site, { foreignKey: 'siteId' });
    Inspection.belongsTo(models.InspectionType, { foreignKey: 'inspectionTypeId' });
  };

  return Inspection;
};