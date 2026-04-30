const database = require('../config/db');

const refreshTokenModel = {
  create: async ({ userId, token, deviceInfo, ipAddress, expiredAt }) => {
    await database.execute(
      `INSERT INTO refresh_tokens (userId, token, deviceInfo, ipAddress, expiredAt)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, token, deviceInfo || null, ipAddress || null, expiredAt]
    );
  },

  findByToken: async (token) => {
    const [rows] = await database.execute(
      `SELECT id, userId, token, expiredAt
       FROM refresh_tokens
       WHERE token = ? AND revoked = 0 AND expiredAt > NOW()
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  revoke: async (token) => {
    await database.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE token = ?',
      [token]
    );
  },

  revokeAllForUser: async (userId) => {
    await database.execute(
      'UPDATE refresh_tokens SET revoked = 1 WHERE userId = ?',
      [userId]
    );
  }
};

module.exports = refreshTokenModel;
