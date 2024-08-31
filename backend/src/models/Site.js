module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define('Site', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  Site.associate = (models) => {
    Site.belongsTo(models.Entrepreneur, { 
      foreignKey: 'entrepreneurId', 
      onDelete: 'CASCADE' 
    });
    Site.hasMany(models.InspectionType, { 
      foreignKey: 'siteId', 
      onDelete: 'CASCADE' 
    });
  };

  return Site;
};