'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      this.hasMany(models.PostImage, {
        foreignKey: 'post_id',
        as: 'images',
        onDelete: 'CASCADE'
      });
      this.belongsTo(models.User, {
        foreignKey: 'author_id',
        as: 'author',
        // Đặt alias cho User
        onDelete: 'CASCADE'
      });
    }
  }
  Post.init({
    post_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_qna: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    cmt_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    updatedAt: false
  });
  return Post;
};