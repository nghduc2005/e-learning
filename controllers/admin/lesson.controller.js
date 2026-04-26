const { lessonService } = require("../../services/lesson.service.js");

const lessonController = {
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
    })
  },
  create: (req, res) => {
    res.render("admin/lessonCreate", {
      title: "Tạo bài học"
    })
  },
  createPost: async (req, res) => {
    try {
      const { title, status, learnMode, score, questionsList } = req.body;
      const content = req.body.content; 
      const document = req.body.document ? JSON.stringify(req.body.document) : null;
      
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
      if (req.body.document) {
        updateData.document = JSON.stringify(req.body.document);
      }

      await lessonService.updateLesson(id, updateData);
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
      
      const backURL = req.header('Referer') || '/admin/trash';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi khôi phục bài học:", error);
      res.redirect("/admin/trash");
    }
  }
}

module.exports = lessonController