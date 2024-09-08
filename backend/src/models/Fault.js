module.exports = (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('פתוח', 'סגור'),
      defaultValue: 'פתוח'
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reportedTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    entrepreneurName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reporterName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Email System'
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailSubject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailSender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    closedTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    closureNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  Fault.associate = function(models) {
    Fault.belongsTo(models.Site, { foreignKey: 'siteId', as: 'site' });
  };

  return Fault;
};