'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PostLike extends Model {
    static associate(models) {
      // Quan hệ với Post
      this.belongsTo(models.Post, {
        foreignKey: 'post_id',
        as: 'post',
        onDelete: 'CASCADE' // Xóa Post thì xóa cả PostLike
      });

      // Quan hệ với User
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE' // Xóa User thì xóa cả PostLike
      });
    }
  }

  // Định nghĩa mô hình PostLike
  PostLike.init({
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
    modelName: 'PostLike',
    // Tên mô hình
    tableName: 'post_likes',
    // Tên bảng trong cơ sở dữ liệu
    timestamps: false // Tắt auto timestamps nếu không cần
  });
  return PostLike;
};