const { ROLES } = require('../constants/roles');

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
        isIn: [Object.values(ROLES)]
      },
      comment: 'Type of service/role the organization provides'
    }
  });

  Organization.associate = function(models) {
    // Organization has many users
    Organization.hasMany(models.User, {
      foreignKey: 'organizationId',
      as: 'employees',
      onDelete: 'SET NULL'
    });

    // Organization can service many sites
    Organization.belongsToMany(models.Site, {
      through: 'OrganizationSites',
      foreignKey: 'organizationId',
      as: 'servicedSites',
      onDelete: 'CASCADE'
    });

    // Add scope to only include organizations with active users
    Organization.addScope('withActiveUsers', {
      include: [{
        model: models.User,
        as: 'employees',
        where: {
          deletedAt: null
        },
        required: true
      }]
    });

    // Add scopes for each role type
    Object.values(ROLES).forEach(role => {
      Organization.addScope(role, {
        where: { type: role },
        include: [{
          model: models.User,
          as: 'employees',
          where: {
            deletedAt: null,
            role: role
          },
          required: true,
          attributes: ['id', 'name', 'email']
        }]
      });
    });
  };

  return Organization;
};
