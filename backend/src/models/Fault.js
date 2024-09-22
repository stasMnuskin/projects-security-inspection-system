module.exports = (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      set(value) {
        this.setDataValue('description', value.trim());
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'לא צוין',
      set(value) {
        this.setDataValue('location', value.trim());
      }
    },
    status: {
      type: DataTypes.ENUM('פתוח', 'סגור'),
      defaultValue: 'פתוח'
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'אימייל',
      set(value) {
        this.setDataValue('reportedBy', value.trim());
      }
    },
    reportedTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    entrepreneurName: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('entrepreneurName', value.trim());
      }
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue('siteName', value.trim());
      }
    },
    reporterName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'לא ידוע',
      set(value) {
        this.setDataValue('reporterName', value.trim());
      }
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'לא זמין',
      set(value) {
        this.setDataValue('contactNumber', value ? value.trim() : 'לא זמין');
      }
    },
    emailSubject: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue('emailSubject', value ? value.trim() : null);
      }
    },
    emailSender: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue('emailSender', value ? value.trim() : null);
      }
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
    },
    closureNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      set(value) {
        this.setDataValue('closureNotes', value ? value.trim() : null);
      }
    },
    acknowledgedTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disabling: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdByInspectionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Inspections',
        key: 'id'
      }
    }
  });

  Fault.associate = function(models) {
    Fault.belongsTo(models.Site, { foreignKey: 'siteId', as: 'site' });
    Fault.belongsToMany(models.Inspection, {
      through: models.InspectionFault,
      foreignKey: 'faultId',
      otherKey: 'inspectionId'
    });
    Fault.belongsTo(models.Inspection, { 
      foreignKey: 'createdByInspectionId', 
      as: 'createdByInspection',
      constraints: false 
    });
  };

  return Fault;
};