const { trashController } = require('../../controllers/admin/trash.controller');

const router = require('express').Router();

router.get("/", trashController.index);
router.post("/comment/:id/restore", trashController.restoreComment);
router.post("/comment/:id/delete", trashController.deleteComment);

module.exports = router;
