const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Thay đổi thành 10000ms để hiệu quả hơn trên Windows
  idleTimeout: 60000,           // Giải phóng kết nối rảnh rỗi sau 60s (TiDB sẽ tự đóng kết nối sau khoảng 5-10p, ta cần đóng trước)
  maxIdle: 10,                  // Số kết nối rảnh rỗi tối đa
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

const database = pool.promise();

database.getConnection()
  .then(connection => {
    console.log('Kết nối TiDB/MySQL thành công!');
    connection.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối database:', err.message);
  });

module.exports = database;