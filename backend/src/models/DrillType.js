module.exports = (sequelize, DataTypes) => {
  const DrillType = sequelize.define('DrillType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  });

  DrillType.associate = function(models) {
  };

  return DrillType;
};
