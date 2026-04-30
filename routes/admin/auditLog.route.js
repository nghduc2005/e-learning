const router = require('express').Router();
const { auditLogController } = require('../../controllers/admin/auditLog.controller');

router.get('/', auditLogController.list);

module.exports = router;
