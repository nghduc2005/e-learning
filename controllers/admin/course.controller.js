import { courseService } from "../../services/course.service.js";
import curriculumService from "../../services/curriculum.service.js";

export const courseController = {
  list: async (req, res) => {
    const keyword = req.query.q || ''
    const status = req.query.status || ''
    const time = req.query.time || ''
    const students = req.query.students || ''

    // Xử lý page an toàn tuyệt đối
    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1) page = 1;

    const limit = 2;

    const result = await courseService.getCourseList(keyword, status, time, students, page, limit);

    // Nếu page vượt quá tổng số trang, nắn lại bằng tổng số trang
    let finalPage = page;
    if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
      finalPage = result.pagination.totalPages;
    }

    // Nếu người dùng CÓ truyền page lên URL nhưng giá trị đó khác với finalPage đã nắn chuẩn 
    // (VD: nhập -1, abc, hoặc số lớn hơn tổng trang) -> Redirect lại URL chuẩn
    if (req.query.page !== undefined && String(req.query.page) !== String(finalPage)) {
      const queryParams = new URLSearchParams(req.query);
      queryParams.set('page', finalPage);
      const basePath = req.originalUrl.split('?')[0]; // Lấy URL gốc không chứa query
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
        banner: req.body.banner // Lấy trực tiếp từ body do middleware đã xử lý file
      };
      console.log(data);
      
      const response = await courseService.createCourse(data);
      console.log(response);

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

      // KẾT NỐI VỚI SERVICE ĐỂ CẬP NHẬT DATABASE
      await courseService.updateCourse(id, data, deleteBanner);

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
  }
}