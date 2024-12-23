'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConfirmationCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ConfirmationCode.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      // New field to track status
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active' // or 'used', etc.
    }
  }, {
    sequelize,
    tableName: 'confirmation_codes',
    modelName: 'ConfirmationCode',
    timestamps: true
  });
  return ConfirmationCode;
};