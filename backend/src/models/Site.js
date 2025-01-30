module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define('Site', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('radar', 'inductive_fence'),
      allowNull: false,
      defaultValue: 'inductive_fence'
    },
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    controlCenterUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    customFields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidCustomFields(value) {
          if (!Array.isArray(value)) {
            throw new Error('Custom fields must be an array');
          }
          value.forEach(field => {
            if (!field.name || !field.value) {
              throw new Error('Each custom field must have a name and value');
            }
          });
        }
      }
    }
  }, {
    tableName: 'Sites'
  });

  Site.associate = function(models) {
    // Site belongs to an entrepreneur
    Site.belongsTo(models.User.scope('defaultScope'), {
      foreignKey: 'entrepreneurId',
      as: 'entrepreneur',
      onDelete: 'SET NULL'
    });

    // Site belongs to a control center user
    Site.belongsTo(models.User.scope('defaultScope'), {
      foreignKey: 'controlCenterUserId',
      as: 'controlCenter',
      onDelete: 'SET NULL'
    });
    
    // Site has many inspections
    Site.hasMany(models.Inspection, {
      foreignKey: 'siteId',
      as: 'inspections'
    });

    // Site has many faults with paranoid support
    Site.hasMany(models.Fault, {
      foreignKey: 'siteId',
      as: 'faults',
      constraints: false // Allow sites to keep references to soft-deleted faults
    });

    // Site can be serviced by many organizations (integrator/maintenance companies)
    Site.belongsToMany(models.Organization, {
      through: 'OrganizationSites',
      foreignKey: 'siteId',
      as: 'serviceOrganizations',
      onDelete: 'CASCADE'
    });

    // Site has many notification recipients
    Site.belongsToMany(models.User.scope('defaultScope'), {
      through: models.SiteNotificationRecipients,
      foreignKey: 'siteId',
      otherKey: 'userId',
      as: 'notificationRecipients',
      onDelete: 'CASCADE'
    });
  };

  return Site;
};
