const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Entrepreneur = sequelize.define('Entrepreneur', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
  });

  Entrepreneur.associate = (models) => {
    Entrepreneur.hasMany(models.Site, { foreignKey: 'entrepreneurId' });
  };

  return Entrepreneur;
};