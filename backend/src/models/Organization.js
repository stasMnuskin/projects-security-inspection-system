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
        isIn: [['integrator', 'maintenance', 'general']]
      },
      comment: 'Type of service the organization provides. "general" is used for organizations that are not service providers.'
    }
  });

  Organization.associate = function(models) {
    // Organization has many users
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
