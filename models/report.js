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
      type: DataTypes.JSON, // Массив выбранных колонок
      allowNull: true
    },
    filters: {
      type: DataTypes.JSON, // Объект или массив фильтров
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