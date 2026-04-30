const database = require('../config/db');

const auditLogService = {
  getLogs: async ({ keyword = '', adminId = '', time = '', page = 1, limit = 20 }) => {
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push('(l.action LIKE ? OR l.detail LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (adminId) {
      conditions.push('l.adminId = ?');
      params.push(Number(adminId));
    }
    if (time === 'today') {
      conditions.push('DATE(l.createdAt) = CURDATE()');
    } else if (time === 'this_week') {
      conditions.push('l.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    } else if (time === 'this_month') {
      conditions.push('l.createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)');
    } else if (time === '3_months') {
      conditions.push('l.createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH)');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [[{ total }]] = await database.query(
      `SELECT COUNT(*) AS total
       FROM admin_audit_logs l
       LEFT JOIN admins a ON l.adminId = a.id
       ${where}`,
      params
    );

    const [rows] = await database.query(
      `SELECT l.id, l.action, l.detail, l.createdAt, l.targetUserId,
              a.username AS adminUsername
       FROM admin_audit_logs l
       LEFT JOIN admins a ON l.adminId = a.id
       ${where}
       ORDER BY l.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return {
      logs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  getAdmins: async () => {
    const [rows] = await database.query(
      'SELECT id, username FROM admins ORDER BY username ASC'
    );
    return rows;
  }
};

module.exports = { auditLogService };
