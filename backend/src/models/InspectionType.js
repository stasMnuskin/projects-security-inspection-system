const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InspectionType = sequelize.define('InspectionType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false
    }
  });

  InspectionType.associate = (models) => {
    InspectionType.belongsTo(models.Site, { foreignKey: 'siteId' });
  };

  return InspectionType;
};