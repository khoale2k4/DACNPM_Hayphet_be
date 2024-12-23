const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/noticesController');

// Lấy tất cả thông báo của một userId
router.get('/notices/:userId', noticesController.getAllNotificationsByUser);

// Xóa thông báo bằng id
router.delete('/notices/:id', noticesController.deleteNotificationById);
module.exports = router;