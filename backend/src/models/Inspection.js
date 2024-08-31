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
      allowNull: false
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
  });

  Inspection.associate = (models) => {
    Inspection.belongsTo(models.Entrepreneur, { 
      foreignKey: 'entrepreneurId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.Site, { 
      foreignKey: 'siteId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.InspectionType, { 
      foreignKey: 'inspectionTypeId', 
      onDelete: 'CASCADE' 
    });
    Inspection.belongsTo(models.User, { 
      foreignKey: 'userId', 
      onDelete: 'SET NULL' 
    });
  };

  return Inspection;
};