import { lessonService } from "../../services/lesson.service.js";
import commentService from "../../services/comment.service.js";
import logAction from "../../utils/auditLogger.js";

export const lessonController = {
  list: async (req, res) => {
    const keyword = req.query.q || '';
    const status = req.query.status || '';
    const time = req.query.time || '';

    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1) page = 1;

    const limit = 5;

    const result = await lessonService.getLessonList(keyword, status, time, page, limit);

    let finalPage = page;
    if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
      finalPage = result.pagination.totalPages;
    }

    if (req.query.page !== undefined && String(req.query.page) !== String(finalPage)) {
      const queryParams = new URLSearchParams(req.query);
      queryParams.set('page', finalPage);
      const basePath = req.originalUrl.split('?')[0];
      return res.redirect(`${basePath}?${queryParams.toString()}`);
    }

    res.render("admin/lessonList", {
      title: "Danh sách bài học",
      lessonList: result.lessons,
      pagination: result.pagination,
      query: req.query
    });
  },

  detail: async (req, res) => {
    try {
      const id = req.params.id;
      const lesson = await lessonService.getLessonById(id);

      if (!lesson) {
        return res.redirect("/admin/lesson/list");
      }
      res.render("admin/lessonDetail", {
        title: "Chi tiết bài học",
        lesson: lesson
      });
    } catch (error) {
      console.error("Lỗi trang Detail Lesson:", error);
      res.redirect("/admin/lesson/list");
    }
  },

  create: (req, res) => {
    res.render("admin/lessonCreate", {
      title: "Tạo bài học"
    });
  },

  createPost: async (req, res) => {
    try {
      const { title, status, learnMode, score, questionsList, document } = req.body;
      const content = req.body.content;

      const parsedQuestions = questionsList ? (typeof questionsList === 'string' ? JSON.parse(questionsList) : questionsList) : [];
      await lessonService.createLesson({
        name: title,
        status,
        learnMode,
        passScore: score,
        content,
        document,
        questionsList: parsedQuestions
      });

      await logAction(req.session.admin?.id, 'create_lesson', `Tạo bài học: ${title}`);

      res.json({ success: true, redirectUrl: '/admin/lesson/list' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  edit: async (req, res) => {
    try {
      const id = req.params.id;
      const lesson = await lessonService.getLessonById(id);
      console.log(lesson);

      if (!lesson) {
        return res.redirect("/admin/lesson/list");
      }
      res.render("admin/lessonEdit", {
        title: "Chỉnh sửa bài học",
        lesson: lesson
      });
    } catch (error) {
      console.error(error);
      res.redirect("/admin/lesson/list");
    }
  },

  editPost: async (req, res) => {
    try {
      const id = req.params.id;
      const { title, status, learnMode, score, questionsList } = req.body;

      const updateData = {
        name: title,
        status,
        learnMode,
        passScore: score,
        questionsList: questionsList ? (typeof questionsList === 'string' ? JSON.parse(questionsList) : questionsList) : []
      };

      if (req.body.content) {
        updateData.content = req.body.content;
      }
      if (req.body.document !== undefined) {
        updateData.document = req.body.document;
      }

      await lessonService.updateLesson(id, updateData);

      await logAction(req.session.admin?.id, 'update_lesson', `Cập nhật bài học: ${title}`);

      res.json({ success: true, redirectUrl: '/admin/lesson/list' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      await lessonService.deleteLesson(id);

      await logAction(req.session.admin?.id, 'delete_lesson', `Xóa bài học #${id}`);

      const backURL = req.header('Referer') || '/admin/lesson/list';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi xóa bài học:", error);
      res.redirect("/admin/lesson/list");
    }
  },

  restore: async (req, res) => {
    try {
      const id = req.params.id;
      await lessonService.restoreLesson(id);

      await logAction(req.session.admin?.id, 'restore_lesson', `Khôi phục bài học #${id}`);

      const backURL = req.header('Referer') || '/admin/trash';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi khôi phục bài học:", error);
      res.redirect("/admin/trash");
    }
  },

  // ── Quản lý bình luận ──────────────────────────────────────────────────────

  comments: async (req, res) => {
    try {
      const lessonId = req.params.id;
      const lesson = await lessonService.getLessonById(lessonId);
      if (!lesson) return res.redirect("/admin/lesson/list");

      const [comments, reports] = await Promise.all([
        commentService.getCommentsByLessonId(lessonId),
        commentService.getReportsByLessonId(lessonId),
      ]);

      const pendingCount = reports.filter(r => r.reportStatus === 'pending').length;

      res.render("admin/lessonCommentManage", {
        title: `Quản lý bình luận – ${lesson.name}`,
        lesson,
        comments,
        reports,
        pendingCount,
        tab: req.query.tab || 'comments',
      });
    } catch (error) {
      console.error("Lỗi trang quản lý bình luận bài học:", error);
      res.redirect("/admin/lesson/list");
    }
  },

  hideComment: async (req, res) => {
    try {
      await commentService.hideComment(req.params.commentId);
      await logAction(req.session.admin?.id, 'hide_comment', `Ẩn bình luận #${req.params.commentId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể ẩn bình luận" });
    }
  },

  restoreComment: async (req, res) => {
    try {
      await commentService.restoreComment(req.params.commentId);
      await logAction(req.session.admin?.id, 'restore_comment', `Khôi phục bình luận #${req.params.commentId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể khôi phục bình luận" });
    }
  },

  hardDeleteComment: async (req, res) => {
    try {
      await commentService.hardDeleteComment(req.params.commentId);
      await logAction(req.session.admin?.id, 'delete_comment', `Xóa vĩnh viễn bình luận #${req.params.commentId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa bình luận" });
    }
  },

  acceptReport: async (req, res) => {
    try {
      await commentService.acceptReport(req.params.reportId);
      await logAction(req.session.admin?.id, 'accept_report', `Chấp nhận báo cáo #${req.params.reportId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể chấp nhận báo cáo" });
    }
  },

  acceptReportHardDelete: async (req, res) => {
    try {
      await commentService.acceptReportAndHardDelete(req.params.reportId);
      await logAction(req.session.admin?.id, 'delete_comment', `Chấp nhận báo cáo #${req.params.reportId} – xóa vĩnh viễn bình luận`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa bình luận" });
    }
  },

  rejectReport: async (req, res) => {
    try {
      await commentService.rejectReport(req.params.reportId);
      await logAction(req.session.admin?.id, 'reject_report', `Từ chối báo cáo #${req.params.reportId}`);
      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể từ chối báo cáo" });
    }
  },
};
