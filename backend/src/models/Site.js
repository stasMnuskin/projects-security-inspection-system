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
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    integratorUserIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidUserIds(value) {
          if (!Array.isArray(value)) {
            throw new Error('Integrator user IDs must be an array');
          }
        }
      }
    },
    maintenanceUserIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidUserIds(value) {
          if (!Array.isArray(value)) {
            throw new Error('Maintenance user IDs must be an array');
          }
        }
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
    Site.belongsTo(models.User, {
      foreignKey: 'entrepreneurId',
      as: 'entrepreneur'
    });

    Site.belongsTo(models.User, {
      foreignKey: 'controlCenterUserId',
      as: 'controlCenter'
    });
    
    Site.hasMany(models.Inspection, {
      foreignKey: 'siteId',
      as: 'inspections'
    });

    Site.hasMany(models.Fault, {
      foreignKey: 'siteId',
      as: 'faults'
    });
  };

  return Site;
};
