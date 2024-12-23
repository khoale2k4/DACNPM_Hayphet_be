'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PostNotification extends Model {
    static associate(models) {
      this.belongsTo(models.Post, {
        foreignKey: 'post_id',
        as: 'post',
        onDelete: 'CASCADE'
      });
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }
  PostNotification.init({
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true // Khóa chính kết hợp với post_id
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true // Khóa chính kết hợp với user_id
    }
  }, {
    sequelize,
    modelName: 'PostNotification',
    // Tên mô hình
    tableName: 'post_notification',
    // Tên bảng trong cơ sở dữ liệu
    timestamps: false // Tắt auto timestamps nếu không cần
  });
  return PostNotification;
};