const database = require('../config/db');

async function logAction(adminId, action, detail = null, targetUserId = null) {
  if (!adminId) return;
  try {
    await database.query(
      'INSERT INTO admin_audit_logs (adminId, action, detail, targetUserId) VALUES (?, ?, ?, ?)',
      [adminId, action, detail || null, targetUserId || null]
    );
  } catch (err) {
    console.error('[AuditLog] Lỗi ghi nhật ký:', err.message);
  }
}

module.exports = logAction;
