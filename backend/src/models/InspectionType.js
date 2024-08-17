module.exports = (sequelize, DataTypes) => {
  const InspectionType = sequelize.define('InspectionType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annually'),
      allowNull: false,
      defaultValue: 'monthly'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    requiredEquipment: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
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