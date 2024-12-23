'use strict';

const {
  Model
} = require("sequelize");

// models/PostImage.js
module.exports = (sequelize, DataTypes) => {
  class PostImage extends Model {
    static associate(models) {
      // Define associations here
      this.belongsTo(models.Post, {
        foreignKey: "post_id",
        as: "post",
        onDelete: "CASCADE" // Khi xóa bảng posts, các bản ghi liên quan trong post_images cũng bị xóa
      });
    }
  }
  PostImage.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    post_id: {
      type: DataTypes.UUID,
      // Kiểu UUID cho khóa ngoại
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'PostImage',
    tableName: 'post_images',
    timestamps: false // Tắt auto timestamps nếu không cần
  });
  return PostImage;
};