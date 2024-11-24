module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['integrator', 'maintenance']]
      },
      comment: 'Type of service the organization provides'
    }
  });

  Organization.associate = function(models) {
    // Organization has many users (employees)
    Organization.hasMany(models.User, {
      foreignKey: 'organizationId',
      as: 'employees'
    });

    // Organization can service many sites
    Organization.belongsToMany(models.Site, {
      through: 'OrganizationSites',
      foreignKey: 'organizationId',
      as: 'servicedSites'
    });
  };

  return Organization;
};
