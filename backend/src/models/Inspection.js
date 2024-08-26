module.exports = (sequelize, DataTypes) => {
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
      allowNull: false,
      validate: {
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'pending'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [
      {
        fields: ['entrepreneurId']
      },
      {
        fields: ['siteId']
      },
      {
        fields: ['inspectionTypeId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['userId']
      }
    ]
  });

  Inspection.associate = function(models) {
    Inspection.belongsTo(models.Entrepreneur, { foreignKey: 'entrepreneurId' });
    Inspection.belongsTo(models.Site, { foreignKey: 'siteId' });
    Inspection.belongsTo(models.InspectionType, { foreignKey: 'inspectionTypeId' });
    Inspection.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Inspection;
};