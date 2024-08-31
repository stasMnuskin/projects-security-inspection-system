module.exports = (sequelize, DataTypes) => {
  const Entrepreneur = sequelize.define('Entrepreneur', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    contactPerson: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true }
    }
  });

  Entrepreneur.associate = (models) => {
    Entrepreneur.hasMany(models.Site, { 
      foreignKey: 'entrepreneurId', 
      onDelete: 'CASCADE' 
    });
  };

  return Entrepreneur;
};