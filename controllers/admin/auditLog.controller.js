const { auditLogService } = require('../../services/auditLog.service');

const auditLogController = {
  list: async (req, res, next) => {
    try {
      const { q = '', adminId = '', time = '', page = 1 } = req.query;
      const limit = 20;

      const [{ logs, pagination }, admins] = await Promise.all([
        auditLogService.getLogs({ keyword: q, adminId, time, page, limit }),
        auditLogService.getAdmins()
      ]);

      res.render('admin/auditLog/index', {
        title: 'Nhật ký hoạt động',
        logs,
        pagination,
        admins,
        query: new URLSearchParams(req.query).toString()
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { auditLogController };
