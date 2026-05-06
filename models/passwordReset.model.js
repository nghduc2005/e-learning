'use strict';
const database = require('../config/db');

const passwordResetModel = {
  create: async ({ userId, token, expiredAt }) => {
    // Xoá token cũ của user trước khi tạo mới
    await database.execute('DELETE FROM password_resets WHERE userId = ?', [userId]);
    const [result] = await database.execute(
      'INSERT INTO password_resets (userId, token, expiredAt) VALUES (?, ?, ?)',
      [userId, token, expiredAt]
    );
    return result.insertId;
  },

  findValidByToken: async (token) => {
    const [rows] = await database.execute(
      `SELECT * FROM password_resets
       WHERE token = ? AND isUsed = 0 AND expiredAt > NOW()
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  markUsed: async (id) => {
    await database.execute(
      'UPDATE password_resets SET isUsed = 1 WHERE id = ?',
      [id]
    );
  },
};

module.exports = passwordResetModel;
