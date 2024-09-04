module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define('Site', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'Sites'
  });

  Site.associate = function(models) {
    Site.belongsTo(models.User, {
      foreignKey: 'entrepreneurId',
      as: 'entrepreneur'
    });
    Site.hasMany(models.Fault, {
      foreignKey: 'siteId',
      as: 'faults'
    });
  };

  return Site;
};