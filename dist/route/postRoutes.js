const express = require('express');
const postController = require('../controllers/postController');
const router = express.Router();
const upload = require('../middlewares/upload');
const {
  isAuthenticated
} = require('../middlewares/auth');
router.post('/upload-image', isAuthenticated,
// Xác thực nếu cần (hoặc bỏ nếu muốn cho phép tất cả)
upload.single('upload'),
// Multer xử lý tệp được gửi dưới key "upload"
(req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: 'Không có tệp nào được tải lên.'
      });
    }

    // Tạo URL cho ảnh đã tải lên
    const imageUrl = `http://localhost:${process.env.PORT || 3000}/api/uploads/${file.filename}`;

    // CKEditor yêu cầu trả về định dạng này
    res.status(201).json({
      uploaded: true,
      url: imageUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      uploaded: false,
      error: err.message
    });
  }
});

// Route upload ảnh từ CKEditor (dạng base64)
router.post('/upload-image-base64', isAuthenticated,
// Xác thực nếu cần (hoặc bỏ nếu muốn cho phép tất cả)
async (req, res) => {
  try {
    const {
      upload
    } = req.body;
    if (!upload) {
      return res.status(400).json({
        error: 'Không có ảnh base64 được tải lên.'
      });
    }

    // Xử lý ảnh base64
    const imageUrl = await uploadImageFromBase64(upload); // Sử dụng hàm uploadImageFromBase64 để lưu ảnh

    // CKEditor yêu cầu trả về định dạng này
    res.status(201).json({
      uploaded: true,
      url: `http://localhost:${process.env.PORT || 3000}${imageUrl}` // URL trả về cho CKEditor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      uploaded: false,
      error: err.message
    });
  }
});

// Route xem bài viết
router.get('/posts/search', postController.searchPosts);
router.get('/users/:userId/posts', postController.getPostsByUser);
router.get('/posts', postController.getAllPosts); // Lấy danh sách bài viết
router.get('/posts/:postId', postController.getPostById); // Lấy bài viết theo ID
router.get('/posts/popular', postController.getPopularPosts);
// Các route yêu cầu xác thực session
router.post('/posts', isAuthenticated, upload.fields([{
  name: 'avatar',
  maxCount: 1
},
// Avatar chỉ 1 ảnh
{
  name: 'images',
  maxCount: 10
} // Ảnh nội dung
]), postController.createPost);

// Route cập nhật bài viết (avatar và nội dung)
router.put('/posts/:postId', isAuthenticated, upload.fields([{
  name: 'avatar',
  maxCount: 1
},
// Avatar chỉ 1 ảnh
{
  name: 'images',
  maxCount: 10
} // Ảnh nội dung
]), postController.updatePost);
router.post('/posts/:postId/like', isAuthenticated, postController.likePost); // Thích bài viết
router.post('/posts/:postId/like-status', isAuthenticated, postController.likeStatus); // Thích bài viết
router.post('/posts/:postId/follow', isAuthenticated, postController.followPost); // Thích bài viết
router.post('/posts/:postId/follow-status', isAuthenticated, postController.followStatus); // Thích bài viết

module.exports = router;