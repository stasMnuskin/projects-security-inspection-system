module.exports = (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    parameter: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      defaultValue: 'open'
    },
    openedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    closedAt: {
      type: DataTypes.DATE
    }
  });

  Fault.associate = function(models) {
    Fault.belongsTo(models.Site, { foreignKey: 'siteId' });
    Fault.belongsTo(models.InspectionType, { foreignKey: 'inspectionTypeId' });
  };

  return Fault;
};