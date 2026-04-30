const database = require('../config/db.js');

const adminModel = {
  findByUsername: async (username) => {
    const [rows] = await database.execute(
      `SELECT id, username, email, password, status
       FROM admins
       WHERE username = ?
       LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await database.execute(
      `SELECT id, username, email, status, createdAt
       FROM admins
       WHERE id = ? AND status = 'active'
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  findByEmail: async (email, excludeId = null) => {
    const query = excludeId
      ? 'SELECT id FROM admins WHERE email = ? AND id != ? LIMIT 1'
      : 'SELECT id FROM admins WHERE email = ? LIMIT 1';
    const params = excludeId ? [email, excludeId] : [email];
    const [rows] = await database.execute(query, params);
    return rows[0] || null;
  },

  updateEmail: async (id, email) => {
    await database.execute(
      'UPDATE admins SET email = ? WHERE id = ?',
      [email, id]
    );
  },

  updatePassword: async (id, hashedPassword) => {
    await database.execute(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  },

  countAll: async () => {
    const [rows] = await database.execute('SELECT COUNT(*) AS total FROM admins');
    return rows[0].total;
  }
};

module.exports = adminModel;
