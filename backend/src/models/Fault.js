module.exports = (sequelize, DataTypes) => {
  const Fault = sequelize.define('Fault', {
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
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
      type: DataTypes.ENUM('open', 'closed'),
      defaultValue: 'open'
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
      allowNull: false,
      defaultValue: 'N/A'
    }
  });

  Fault.associate = function(models) {
    Fault.belongsTo(models.Site, { foreignKey: 'siteId' });
  };

  return Fault;
};