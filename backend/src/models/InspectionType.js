module.exports = (sequelize, DataTypes) => {
  const InspectionType = sequelize.define('InspectionType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    formStructure: {
      type: DataTypes.JSON,
      allowNull: false
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  InspectionType.associate = function(models) {
    InspectionType.belongsTo(models.Site, { 
      foreignKey: 'siteId', 
      onDelete: 'CASCADE' 
    });
    InspectionType.hasMany(models.Inspection, { 
      foreignKey: 'inspectionTypeId', 
      onDelete: 'CASCADE' 
    });
  };


  return InspectionType;
};