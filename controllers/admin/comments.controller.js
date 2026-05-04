import commentService from "../../services/comment.service.js";
import logAction from "../../utils/auditLogger.js";

const VALID_FILTERS = new Set(["all", "reported", "hidden"]);

export const commentsController = {
  index: async (req, res) => {
    try {
      let filter = req.query.filter || "all";
      if (!VALID_FILTERS.has(filter)) filter = "all";

      const [allComments, pendingReports] = await Promise.all([
        commentService.getAllCommentsForAdmin(),
        commentService.getPendingReportsGlobal(),
      ]);

      const hiddenCount = allComments.filter((c) => c.isDeleted).length;
      const reportedCount = pendingReports.length;

      res.render("admin/commentsManage", {
        title: "Quản lý bình luận",
        filter,
        allComments,
        pendingReports,
        hiddenCount,
        reportedCount,
      });
    } catch (error) {
      console.error("Lỗi trang quản lý bình luận:", error);
      res.redirect("/admin/dashboard");
    }
  },

  hideComment: async (req, res) => {
    try {
      await commentService.hideComment(req.params.commentId);
      await logAction(req.session.admin?.id, "hide_comment", `Ẩn bình luận #${req.params.commentId} (toàn cục)`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể ẩn bình luận" });
    }
  },

  restoreComment: async (req, res) => {
    try {
      await commentService.restoreComment(req.params.commentId);
      await logAction(req.session.admin?.id, "restore_comment", `Khôi phục bình luận #${req.params.commentId} (toàn cục)`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể khôi phục bình luận" });
    }
  },

  hardDeleteComment: async (req, res) => {
    try {
      await commentService.hardDeleteComment(req.params.commentId);
      await logAction(req.session.admin?.id, "delete_comment", `Xóa vĩnh viễn bình luận #${req.params.commentId} (toàn cục)`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa bình luận" });
    }
  },

  acceptReportHide: async (req, res) => {
    try {
      await commentService.acceptReport(req.params.reportId);
      await logAction(req.session.admin?.id, "accept_report", `Chấp nhận báo cáo #${req.params.reportId} – ẩn bình luận`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xử lý báo cáo" });
    }
  },

  acceptReportHardDelete: async (req, res) => {
    try {
      await commentService.acceptReportAndHardDelete(req.params.reportId);
      await logAction(req.session.admin?.id, "delete_comment", `Chấp nhận báo cáo #${req.params.reportId} – xóa vĩnh viễn bình luận`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa bình luận" });
    }
  },

  rejectReport: async (req, res) => {
    try {
      await commentService.rejectReport(req.params.reportId);
      await logAction(req.session.admin?.id, "reject_report", `Từ chối báo cáo #${req.params.reportId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể từ chối báo cáo" });
    }
  },
};
