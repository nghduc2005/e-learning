const database = require('../config/db');

const emailVerificationModel = {
  /**
   * Tạo bản ghi xác thực email mới.
   * Token cũ chưa dùng của user này vẫn giữ nguyên; token mới sẽ được dùng.
   */
  create: async ({ userId, token, expiredAt }) => {
    const [result] = await database.execute(
      'INSERT INTO email_verifications (userId, token, expiredAt) VALUES (?, ?, ?)',
      [userId, token, expiredAt]
    );
    return result.insertId;
  },

  /**
   * Tìm bản ghi hợp lệ theo token.
   * Hợp lệ = chưa dùng (isUsed = 0) và chưa hết hạn.
   */
  findValidByToken: async (token) => {
    const [rows] = await database.execute(
      `SELECT * FROM email_verifications
       WHERE token = ? AND isUsed = 0 AND expiredAt > NOW()
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  /**
   * Đánh dấu token đã được sử dụng.
   */
  markUsed: async (id) => {
    await database.execute(
      'UPDATE email_verifications SET isUsed = 1 WHERE id = ?',
      [id]
    );
  },
};

module.exports = emailVerificationModel;
