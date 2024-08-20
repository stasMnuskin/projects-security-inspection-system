module.exports = (sequelize, DataTypes) => {
  const InspectionType = sequelize.define('InspectionType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {} // ערך ברירת מחדל ריק
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  InspectionType.associate = function(models) {
    InspectionType.belongsTo(models.Site, { foreignKey: 'siteId' });
  };

  return InspectionType;
};