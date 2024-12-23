const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ cho `multer`
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu trữ ảnh
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Lấy phần mở rộng của tệp
    cb(null, Date.now() + ext); // Tạo tên file duy nhất với timestamp
  }
});

// Cấu hình multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  // Giới hạn kích thước tệp tối đa là 10MB
  fileFilter: (req, file, cb) => {
    // Kiểm tra phần mở rộng và mimetype của tệp để chỉ cho phép ảnh
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    if (extname && mimetype) {
      cb(null, true); // Tệp hợp lệ
    } else {
      cb(new Error('Chỉ hỗ trợ các tệp hình ảnh!'), false); // Tệp không hợp lệ
    }
  }
}); // Cấu hình multer chỉ tải lên một tệp duy nhất với key "upload"

module.exports = upload;