const { commentsController } = require("../../controllers/admin/comments.controller");

const router = require("express").Router();

router.get("/", commentsController.index);
router.post("/comment/:commentId/hide", commentsController.hideComment);
router.post("/comment/:commentId/restore", commentsController.restoreComment);
router.post("/comment/:commentId/delete", commentsController.hardDeleteComment);
router.post("/report/:reportId/accept-hide", commentsController.acceptReportHide);
router.post("/report/:reportId/accept-delete", commentsController.acceptReportHardDelete);
router.post("/report/:reportId/reject", commentsController.rejectReport);

module.exports = router;
