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