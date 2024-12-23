'use strict';

module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    post_id: {
      type: DataTypes.UUID,
      // Cập nhật kiểu dữ liệu cho post_id (UUID cho Post)
      allowNull: false,
      references: {
        model: 'Posts',
        // Chỉ rõ model mà khóa ngoại này tham chiếu tới
        key: 'post_id',
        // Chỉ rõ cột khóa chính của bảng Post
        onDelete: 'CASCADE'
      }
    },
    reporterId: {
      type: DataTypes.UUID,
      // Cập nhật kiểu dữ liệu cho reporterId (UUID cho User)
      allowNull: false,
      references: {
        model: 'Users',
        // Chỉ rõ model mà khóa ngoại này tham chiếu tới
        key: 'id',
        // Chỉ rõ cột khóa chính của bảng User
        onDelete: 'CASCADE'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      allowNull: false
    },
    resolvedBy: {
      type: DataTypes.UUID,
      // Cập nhật kiểu dữ liệu cho resolvedBy (UUID cho User)
      allowNull: true,
      references: {
        model: 'Users',
        // Chỉ rõ model mà khóa ngoại này tham chiếu tới
        key: 'id' // Chỉ rõ cột khóa chính của bảng User
      }
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  // Định nghĩa các mối quan hệ giữa Report và các model khác
  Report.associate = function (models) {
    // Mối quan hệ với Post
    Report.belongsTo(models.Post, {
      foreignKey: 'post_id',
      // Khoá ngoại tham chiếu đến Post
      as: 'post' // Alias để truy cập Post từ Report
    });

    // Mối quan hệ với User (người báo cáo)
    Report.belongsTo(models.User, {
      foreignKey: 'reporterId',
      // Khoá ngoại tham chiếu đến User
      as: 'reporter' // Alias để truy cập User từ Report (người báo cáo)
    });

    // Mối quan hệ với User (người giải quyết)
    Report.belongsTo(models.User, {
      foreignKey: 'resolvedBy',
      // Khoá ngoại tham chiếu đến User (người giải quyết)
      as: 'resolver' // Alias để truy cập User từ Report (người giải quyết)
    });
  };
  return Report;
};