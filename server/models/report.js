'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Report.init({
    title: DataTypes.STRING,
    entityName: DataTypes.STRING,
    selectedFields: DataTypes.JSON,
    filters: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Report',
  });
  return Report;
};