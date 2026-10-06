module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    selectedFields: {
      type: DataTypes.JSON,
      allowNull: true
    },
    filters: {
      type: DataTypes.JSON,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });

  return Report;
};