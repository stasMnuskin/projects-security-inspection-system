module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'security_officer', 'entrepreneur', 'inspector'),
      allowNull: false,
    },
    passwordChangeRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  User.associate = function(models) {
    User.hasMany(models.Site, {
       foreignKey: 'entrepreneurId',
       as: 'sites' 
      });
  };

  return User;
};