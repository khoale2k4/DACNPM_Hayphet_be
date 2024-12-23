const {
  Sequelize
} = require('sequelize');
require('dotenv').config();
const {
  DATABASE_URL,
  // URL kết nối đầy đủ
  MYSQL_DATABASE,
  MYSQLHOST,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLPORT
} = process.env;

// Tạo kết nối Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});
let connectDB = async () => {
  try {
    // Kiểm tra kết nối đến database
    await sequelize.authenticate();
    console.log('Connected to the database successfully.');

    // Đồng bộ database schema (nếu cần)
    await sequelize.sync({
      // alter: true, // Thay đổi schema mà không mất dữ liệu
      // force: true, // Xóa và tạo lại các bảng, dùng trong môi trường phát triển
      logging: false
    });
    console.log('Database synchronized successfully.');
    if (DATABASE_URL) console.log("URL", DATABASE_URL);
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }
};
module.exports = connectDB;