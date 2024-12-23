'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      // Comment belongs to a User
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        // Alias for the user who made the comment
        onDelete: 'CASCADE'
      });

      // Comment belongs to a Post
      this.belongsTo(models.Post, {
        foreignKey: 'postId',
        as: 'post',
        // Alias for the post associated with the comment
        onDelete: 'CASCADE'
      });

      // Comment can have replies (self-referencing association)
      this.hasMany(models.Comment, {
        foreignKey: 'commentId',
        // Parent comment ID
        as: 'replies',
        // Alias for replies to the comment
        onDelete: 'CASCADE'
      });
    }
  }
  Comment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false // Comment must have content
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false // Each comment must be associated with a user
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false // Each comment must be associated with a post
    },
    commentId: {
      type: DataTypes.UUID,
      allowNull: true // This field is only populated for replies to other comments
    }
  }, {
    sequelize,
    // Pass the Sequelize instance
    modelName: 'Comment',
    tableName: 'comments',
    // Explicitly define table name
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
  });
  return Comment;
};