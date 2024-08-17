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
      type: DataTypes.ENUM('admin', 'security_officer', 'technician', 'inspector'),
      allowNull: false,
    },
  });

  User.associate = function(models) {
    User.belongsToMany(models.Site, { through: 'UserSites' });
  };

  return User;
};