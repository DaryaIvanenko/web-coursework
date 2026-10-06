'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Deal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Deal.init({
    amount: DataTypes.DECIMAL,
    quantity: DataTypes.INTEGER,
    discount: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    dealDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Deal',
  });
  return Deal;
};