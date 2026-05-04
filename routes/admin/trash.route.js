const { trashController } = require('../../controllers/admin/trash.controller');

const router = require('express').Router();

router.get("/", trashController.index);

module.exports = router;
