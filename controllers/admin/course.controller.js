import { courseService } from "../../services/course.service.js";
import curriculumService from "../../services/curriculum.service.js";
import reviewService from "../../services/review.service.js";
import logAction from "../../utils/auditLogger.js";

export const courseController = {
  list: async (req, res) => {
    const keyword = req.query.q || ''
    const status = req.query.status || ''
    const time = req.query.time || ''
    const students = req.query.students || ''

    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1) page = 1;

    const limit = 2;

    const result = await courseService.getCourseList(keyword, status, time, students, page, limit);

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

    res.render("admin/courseList", {
      title: "Danh sách khóa học",
      courseList: result.courses,
      pagination: result.pagination,
      query: req.query
    })
  },

  detail: async (req, res) => {
    try {
      const id = req.params.id;
      const course = await courseService.getCourseById(id);
      if (!course) {
        return res.redirect("/admin/course/list");
      }

      const curriculum = await curriculumService.getCurriculumByCourseId(id);

      res.render("admin/courseDetail", {
        title: "Chi tiết khóa học",
        course: course,
        curriculum: curriculum
      });
    } catch (error) {
      console.error("Lỗi trang Detail:", error);
      res.redirect("/admin/course/list");
    }
  },

  create: (req, res) => {
    res.render("admin/courseCreate", {
      title: "Tạo khóa học"
    })
  },

  edit: async (req, res) => {
    try {
      const id = req.params.id;
      const course = await courseService.getCourseById(id);

      if (!course) {
        return res.redirect("/admin/course/list");
      }

      res.render("admin/courseEdit", {
        title: "Chỉnh sửa khóa học",
        course: course
      });
    } catch (error) {
      console.error("Lỗi trang Edit:", error);
      res.redirect("/admin/course/list");
    }
  },

  curriculum: (req, res) => {
    res.render("admin/curriculum", {
      title: "Chương trình học"
    })
  },

  createPost: async (req, res) => {
    try {
      const data = {
        title: req.body.title,
        status: req.body.status,
        description: req.body.description,
        banner: req.body.banner
      };
      console.log(data);

      const response = await courseService.createCourse(data);
      console.log(response);

      await logAction(req.session.admin?.id, 'create_course', `Tạo khóa học: ${req.body.title}`);

      res.json({
        data: {
          ok: 1,
          message: "Tạo khóa học thành công!"
        }
      });
    } catch (error) {
      console.error("Lỗi khi tạo khóa học:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi trong quá trình tạo khóa học!"
      });
    }
  },

  editPost: async (req, res) => {
    try {
      const id = req.params.id;
      const data = {
        title: req.body.title,
        status: req.body.status,
        description: req.body.description,
        banner: req.body.banner
      };

      const deleteBanner = req.body.deleteBanner === 'true';

      await courseService.updateCourse(id, data, deleteBanner);

      await logAction(req.session.admin?.id, 'update_course', `Cập nhật khóa học: ${req.body.title}`);

      res.json({
        data: {
          ok: 1,
          message: "Cập nhật khóa học thành công!"
        }
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật khóa học:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi trong quá trình cập nhật!"
      });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      await courseService.deleteCourse(id);

      await logAction(req.session.admin?.id, 'delete_course', `Xóa khóa học #${id}`);

      const backURL = req.header('Referer') || '/admin/course/list';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi xóa khóa học:", error);
      res.redirect("/admin/course/list");
    }
  },

  restore: async (req, res) => {
    try {
      const id = req.params.id;
      await courseService.restoreCourse(id);

      await logAction(req.session.admin?.id, 'restore_course', `Khôi phục khóa học #${id}`);

      const backURL = req.header('Referer') || '/admin/course/trash';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi khôi phục khóa học:", error);
      res.redirect("/admin/course/trash");
    }
  },

  getUnits: async (req, res) => {
    try {
      const units = await courseService.getAllUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  },

  getLessons: async (req, res) => {
    try {
      const lessons = await courseService.getAllLessons();
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  },

  getCurriculumData: async (req, res) => {
    try {
      const curriculumData = await curriculumService.getCurriculumByCourseId(req.params.id);
      res.json(curriculumData);
    } catch (error) {
      console.error("Lỗi khi lấy chương trình học:", error);
      res.status(500).json({ error: "Lỗi lấy chương trình học" });
    }
  },

  saveCurriculum: async (req, res) => {
    try {
      await curriculumService.saveCurriculum(req.params.id, req.body.curriculum);

      await logAction(req.session.admin?.id, 'update_curriculum', `Cập nhật chương trình học của khóa học #${req.params.id}`);

      res.json({
        data: {
          ok: 1,
          message: "Lưu chương trình học thành công!"
        }
      });
    } catch (error) {
      console.error("Lỗi khi lưu chương trình học:", error);
      res.status(500).json({
        error: "Đã xảy ra lỗi trong quá trình lưu chương trình học!"
      });
    }
  },

  // ── Quản lý đánh giá ──────────────────────────────────────────────────────

  reviews: async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await courseService.getCourseById(courseId);
      if (!course) return res.redirect("/admin/course/list");

      const reviews = await reviewService.getReviewsByCourseId(courseId);
      console.log(reviews);
      
      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.ratingNum, 0) / reviews.length).toFixed(1)
        : 0;
      console.log(avgRating);
      res.render("admin/reviewManage", {
        title: `Quản lý đánh giá – ${course.name}`,
        course,
        reviews,
        avgRating,
      });
    } catch (error) {
      console.error("Lỗi trang quản lý đánh giá:", error);
      res.redirect("/admin/course/list");
    }
  },

  deleteReview: async (req, res) => {
    try {
      await reviewService.deleteReview(req.params.reviewId);

      await logAction(req.session.admin?.id, 'delete_review', `Xóa đánh giá #${req.params.reviewId}`);

      res.json({ ok: 1 });
    } catch (error) {
      res.status(500).json({ error: "Không thể xóa đánh giá" });
    }
  },
}
