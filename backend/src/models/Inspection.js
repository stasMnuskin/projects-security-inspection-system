module.exports = (sequelize, DataTypes) => {
  const Inspection = sequelize.define('Inspection', {
    entrepreneurId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inspectionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        async isValidDetails(value) {
          const inspectionType = await sequelize.models.InspectionType.findByPk(this.inspectionTypeId);
          if (!inspectionType) {
            throw new Error('Invalid inspection type');
          }
          
          const requiredFields = inspectionType.formStructure.filter(field => field.required).map(field => field.name);
          const missingFields = requiredFields.filter(field => !(field in value));
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }

          Object.keys(value).forEach(key => {
            const field = inspectionType.formStructure.find(f => f.name === key);
            if (!field) {
              throw new Error(`Unknown field: ${key}`);
            }
            
            switch (field.type) {
              case 'number':
                if (isNaN(value[key])) {
                  throw new Error(`${key} must be a number`);
                }
                break;
              case 'boolean':
                if (typeof value[key] !== 'boolean') {
                  throw new Error(`${key} must be a boolean`);
                }
                break;
              case 'select':
              case 'multiselect':
                if (!field.options.includes(value[key])) {
                  throw new Error(`Invalid option for ${key}`);
                }
                break;
              case 'date':
                if (isNaN(Date.parse(value[key]))) {
                  throw new Error(`${key} must be a valid date`);
                }
                break;
            }
          });
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'requires_action'),
      allowNull: false,
      defaultValue: 'pending'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [
      {
        fields: ['entrepreneurId']
      },
      {
        fields: ['siteId']
      },
      {
        fields: ['inspectionTypeId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['userId']
      }
    ]
  });

  Inspection.associate = function(models) {
    Inspection.belongsTo(models.Entrepreneur, { foreignKey: 'entrepreneurId' });
    Inspection.belongsTo(models.Site, { foreignKey: 'siteId' });
    Inspection.belongsTo(models.InspectionType, { foreignKey: 'inspectionTypeId' });
    Inspection.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Inspection;
};