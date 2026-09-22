'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    static associate(models) {
    }
  }
  Report.init({
    title: {
    type: DataTypes.STRING,
    allowNull: false
  },
    entityName: DataTypes.STRING,
    selectedFields: DataTypes.JSON,
    filters: DataTypes.JSON,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Report',
  });
  return Report;
};