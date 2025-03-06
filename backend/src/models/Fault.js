module.exports = (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Sites',
        key: 'id'
      }
    },
    maintenanceOrganizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      }
    },
    integratorOrganizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      }
    },
    maintenanceUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    integratorUserId: {
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
    type: {
      type: DataTypes.ENUM('גדר', 'מצלמות', 'תקשורת', 'אחר'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'יש לבחור סוג תקלה'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        descriptionRequired(value) {
          if (this.type === 'אחר' && (!value || !value.trim())) {
            throw new Error('יש להזין תיאור לתקלה מסוג אחר');
          }
        }
      },
      set(value) {
        this.setDataValue('description', value ? value.trim() : null);
      }
    },
    technician: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue('technician', value ? value.trim() : null);
      }
    },
    isCritical: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'האם התקלה משביתה לחלוטין'
    },
    isPartiallyDisabling: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'האם התקלה משביתה חלקית'
    },
    status: {
      type: DataTypes.ENUM('פתוח', 'בטיפול', 'סגור'),
      allowNull: false,
      defaultValue: 'פתוח'
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('reportedBy', value.trim());
      }
    },
    reportedTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastEmailTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'זמן שליחת המייל האחרון למנהל על תקלה פתוחה'
    },
    lastUpdatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue('lastUpdatedBy', value ? value.trim() : null);
      }
    },
    lastUpdatedTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue('closedBy', value ? value.trim() : null);
      }
    }
  }, {
    tableName: 'Faults',
    paranoid: false,
    hooks: {
      beforeValidate: async (fault) => {
        // If site is provided, ensure entrepreneurId matches
        if (fault.siteId) {
          const site = await sequelize.models.Site.findByPk(fault.siteId);
          if (site) {
            fault.entrepreneurId = site.entrepreneurId;
          }
        }

        // If maintenance/integrator user is set, ensure their organization is set
        if (fault.maintenanceUserId) {
          const user = await sequelize.models.User.findByPk(fault.maintenanceUserId);
          if (user && user.organizationId) {
            fault.maintenanceOrganizationId = user.organizationId;
          }
        }
        if (fault.integratorUserId) {
          const user = await sequelize.models.User.findByPk(fault.integratorUserId);
          if (user && user.organizationId) {
            fault.integratorOrganizationId = user.organizationId;
          }
        }
      },
      beforeUpdate: (fault) => {
        if (fault.changed('status')) {
          if (fault.status === 'סגור') {
            fault.closedTime = new Date();
          }
          fault.lastUpdatedTime = new Date();
        }
      }
    }
  });

  Fault.associate = function(models) {
    Fault.belongsTo(models.Site, { 
      foreignKey: 'siteId',
      as: 'site'
    });
    
    // Organization relationships
    Fault.belongsTo(models.Organization, {
      foreignKey: 'maintenanceOrganizationId',
      as: 'maintenanceOrganization'
    });

    Fault.belongsTo(models.Organization, {
      foreignKey: 'integratorOrganizationId',
      as: 'integratorOrganization'
    });

    // User relationships with paranoid support
    Fault.belongsTo(models.User, {
      foreignKey: 'maintenanceUserId',
      as: 'maintenanceUser',
      constraints: false // Allow faults to keep references to soft-deleted users
    });

    Fault.belongsTo(models.User, {
      foreignKey: 'integratorUserId',
      as: 'integratorUser',
      constraints: false // Allow faults to keep references to soft-deleted users
    });

    Fault.belongsTo(models.User, {
      foreignKey: 'controlCenterUserId',
      as: 'controlCenterUser',
      constraints: false // Allow faults to keep references to soft-deleted users
    });
  };

  // Instance method to check if fault is overdue (open for more than 24 hours)
  Fault.prototype.isOverdue = function() {
    if (this.status === 'סגור') return false;
    
    const now = new Date();
    const openTime = new Date(this.reportedTime);
    const diffHours = (now - openTime) / (1000 * 60 * 60);
    
    return diffHours >= 24;
  };

  // Instance method to check if it's time to send another email
  Fault.prototype.shouldSendEmail = function() {
    if (this.status === 'סגור') return false;
    if (!this.lastEmailTime) return this.isOverdue();
    
    const now = new Date();
    const lastEmail = new Date(this.lastEmailTime);
    const diffHours = (now - lastEmail) / (1000 * 60 * 60);
    
    return diffHours >= 24;
  };

  return Fault;
};
