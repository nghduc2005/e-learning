const database = require('../config/db');

const userModel = {
  findByUsername: async (username) => {
    const [rows] = await database.execute(
      'SELECT id, username, email, password, avatar, status FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  findByEmail: async (email) => {
    const [rows] = await database.execute(
      'SELECT id, username, email, password, avatar, status FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await database.execute(
      'SELECT id, username, email, avatar, status FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ username, email, password }) => {
    const [result] = await database.execute(
      'INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, ?)',
      [username, email, password, 'unverified']
    );
    return result.insertId;
  },

  /**
   * Kích hoạt tài khoản (chuyển status → active).
   */
  activate: async (id) => {
    await database.execute(
      "UPDATE users SET status = 'active' WHERE id = ?",
      [id]
    );
  },

  /**
   * Cập nhật thông tin profile (email, avatar)
   */
  updateProfile: async (id, { email, avatar }) => {
    let sql = 'UPDATE users SET email = ?';
    const params = [email];

    if (avatar) {
      sql += ', avatar = ?';
      params.push(avatar);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await database.execute(sql, params);
  },

  /**
   * Đổi mật khẩu
   */
  updatePassword: async (id, newPassword) => {
    await database.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newPassword, id]
    );
  },
};

module.exports = userModel;
