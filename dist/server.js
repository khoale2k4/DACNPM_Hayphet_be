const express = require('express');
const path = require('path');
const initWebRoutes = require('./route/index.js'); // Để sử dụng các routes
const connectDB = require('./config/database.js'); // Kết nối database
const bodyParser = require('body-parser');
require('dotenv').config();
const passport = require('passport');
require('./passport.js');
const session = require('express-session');
const cors = require('cors');
const app = express();
const http = require('http'); // Import HTTP để tạo server
const {
  initWebSocketServer
} = require('./ws/websocketHandler'); // WebSocket handler

// Cấu hình CORS
const corsOptions = {
  origin: [process.env.CLIENT_URL, "http://localhost:5173"],
  // Đổi với URL frontend (ví dụ: http://localhost:3001)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Cho phép cookie (session)
};

// Cấu hình Session
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  } // Nếu dùng HTTPS, cần đặt true
}));
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS
app.use(cors(corsOptions));

// Xử lý body (JSON và x-www-form-urlencoded)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.json({
  limit: '100mb'
})); // Giới hạn đối với dữ liệu JSON
app.use(express.urlencoded({
  limit: '100mb',
  extended: true
}));

// Kiểm tra và in đường dẫn đến thư mục uploads
console.log('Uploads folder path:', path.join(__dirname, 'uploads'));

// Đảm bảo rằng ảnh và các tệp tĩnh trong thư mục 'uploads' có thể được truy cập
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Kết nối và đồng bộ cơ sở dữ liệu
connectDB();

// Khởi tạo các route
initWebRoutes(app);

// Tạo HTTP server từ Express
const server = http.createServer(app);

// Khởi tạo WebSocket server
initWebSocketServer(server);

// Chạy server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});