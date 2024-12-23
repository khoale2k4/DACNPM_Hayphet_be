const {
  Report,
  Post,
  User,
  Notification
} = require('../models'); // Import models (adjust paths if necessary)
const {
  Sequelize
} = require('sequelize');
const noticesController = {
  async getAllNotificationsByUser(req, res) {
    const {
      userId
    } = req.params;
    try {
      // Tìm notification có user_id trùng với userId hoặc user_id là NULL
      let notifications = await Notification.findAll({
        where: {
          [Sequelize.Op.or]: [{
            user_id: userId
          }, {
            user_id: null
          }]
        },
        order: [['createdAt', 'DESC']]
      });

      // Lọc kết quả dựa trên role nếu notification có 'toMod'
      notifications = notifications.filter(notification => {
        if (notification.toMod) {
          return req.user?.role !== 'user'; // Nếu user role khác 'user' mới giữ lại thông báo.
        }
        return true;
      });
      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: `Lỗi tìm thông báo: ${error.message}`
      });
    }
  },
  async deleteNotificationById(req, res) {
    const {
      id
    } = req.params;
    try {
      const deleted = await Notification.destroy({
        where: {
          id
        }
      });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông báo'
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Xoá thông báo thành công'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xoá thông báo' + error
      });
    }
  }
};
module.exports = noticesController; // Export the controller