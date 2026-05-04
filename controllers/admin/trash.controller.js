import { courseService } from "../../services/course.service.js";
import { unitService } from "../../services/unit.service.js";
import { lessonService } from "../../services/lesson.service.js";

export const trashController = {
  index: async (req, res) => {
    try {
      if (req.query.tab === "comment") {
        return res.redirect("/admin/comments?filter=hidden");
      }

      const tab = req.query.tab || "course";

      let courseList = [];
      let unitList = [];
      let lessonList = [];

      if (tab === "course") {
        courseList = await courseService.getDeletedCourses();
      } else if (tab === "unit") {
        unitList = await unitService.getDeletedUnits();
      } else if (tab === "lesson") {
        lessonList = await lessonService.getDeletedLessons();
      }

      res.render("admin/trash", {
        title: "Thùng rác",
        tab,
        courseList,
        unitList,
        lessonList,
      });
    } catch (error) {
      console.error("Lỗi tải trang Thùng rác:", error);
      res.redirect("/admin/dashboard");
    }
  },
};
