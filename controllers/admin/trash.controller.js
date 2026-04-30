import { courseService } from "../../services/course.service.js";
import { unitService } from "../../services/unit.service.js";
import { lessonService } from "../../services/lesson.service.js";
import commentService from "../../services/comment.service.js";
import logAction from "../../utils/auditLogger.js";

export const trashController = {
  index: async (req, res) => {
    try {
      const tab = req.query.tab || 'course';

      let courseList = [];
      let unitList = [];
      let lessonList = [];
      let commentList = [];

      if (tab === 'course') {
        courseList = await courseService.getDeletedCourses();
      } else if (tab === 'unit') {
        unitList = await unitService.getDeletedUnits();
      } else if (tab === 'lesson') {
        lessonList = await lessonService.getDeletedLessons();
      } else if (tab === 'comment') {
        commentList = await commentService.getDeletedComments();
      }

      res.render("admin/trash", {
        title: "Thùng rác",
        tab,
        courseList,
        unitList,
        lessonList,
        commentList
      });
    } catch (error) {
      console.error("Lỗi tải trang Thùng rác:", error);
      res.redirect("/admin/dashboard");
    }
  },

  restoreComment: async (req, res) => {
    try {
      await commentService.restoreComment(req.params.id);
      await logAction(req.session.admin?.id, 'restore_comment', `Khôi phục bình luận #${req.params.id} từ thùng rác`);
    } catch (error) {
      console.error("Lỗi khôi phục bình luận:", error);
    }
    res.redirect("/admin/trash?tab=comment");
  },

  deleteComment: async (req, res) => {
    try {
      await commentService.hardDeleteComment(req.params.id);
      await logAction(req.session.admin?.id, 'delete_comment', `Xóa vĩnh viễn bình luận #${req.params.id} từ thùng rác`);
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);
    }
    res.redirect("/admin/trash?tab=comment");
  },
};
