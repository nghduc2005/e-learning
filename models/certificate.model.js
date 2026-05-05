'use strict';
const database = require('../config/db');

const certificateModel = {
  findByUserAndCourse: async (userId, courseId) => {
    const [rows] = await database.execute(
      'SELECT * FROM certificates WHERE userId = ? AND courseId = ? LIMIT 1',
      [userId, courseId]
    );
    return rows[0] || null;
  },

  findByVerifyCode: async (verifyCode) => {
    const [rows] = await database.execute(
      `SELECT cert.*, u.username, c.name AS courseName
       FROM certificates cert
       JOIN users u ON u.id = cert.userId
       JOIN courses c ON c.id = cert.courseId
       WHERE cert.verifyCode = ?
       LIMIT 1`,
      [verifyCode]
    );
    return rows[0] || null;
  },

  create: async (userId, courseId, verifyCode) => {
    const [result] = await database.execute(
      'INSERT INTO certificates (userId, courseId, verifyCode) VALUES (?, ?, ?)',
      [userId, courseId, verifyCode]
    );
    return result.insertId;
  },
};

module.exports = certificateModel;
