module.exports = (sequelize, DataTypes) => {
  const Entrepreneur = sequelize.define('Entrepreneur', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true  
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,  
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true  
    }
  });

  Entrepreneur.associate = (models) => {
    Entrepreneur.hasMany(models.Site, { foreignKey: 'entrepreneurId' });
  };

  return Entrepreneur;
};