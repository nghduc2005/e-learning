const learnInteraction = require('../../services/learnInteraction.service');

const learnController = {
  lessonPage: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) return res.redirect('/login');

      const { courseModel } = await import('../../models/course.model.js');
      const { lessonModel } = await import('../../models/lesson.model.js');
      const { progressModel } = await import('../../models/progress.model.js');
      const { commentModel } = await import('../../models/comment.model.js');

      const courseId = parseInt(req.params.courseId);
      const lessonId = parseInt(req.params.lessonId);

      // Kiểm tra đã đăng ký khóa học
      const enrollment = await courseModel.findUserCourse(user.id, courseId);
      if (!enrollment) return res.redirect(`/courses/${courseId}`);

      // Lấy thông tin khóa học + chương trình học
      const course = await courseModel.findCourseDetail(courseId);
      if (!course) return res.status(404).render('errors/404', { layout: false });

      // =========================================================
      // ĐÃ KHÔI PHỤC LẠI LOGIC MAPPING TIẾN ĐỘ CHO SIDEBAR
      // =========================================================
      let progressMap = {};
      if (course.curriculumId) {
        const progresses = await progressModel.findByCurriculum(user.id, course.curriculumId);
        progresses.forEach(p => { progressMap[p.lessonId] = p; });
      }

      // Gắn isCompleted trực tiếp vào từng bài học trong object course
      course.units.forEach(unit => {
        unit.lessons.forEach(l => {
          const p = progressMap[l.id];
          l.isCompleted = p ? Boolean(p.isCompleted) : false;
        });
      });
      // =========================================================

      // Lấy thông tin bài học hiện tại (kèm tài liệu + câu hỏi)
      const lesson = await lessonModel.findById(lessonId);
      if (!lesson) return res.status(404).render('errors/404', { layout: false });

      const questionsForView = (lesson.passScore > 0 && lesson.questionsList?.length)
        ? lesson.questionsList.map(q => ({ id: q.id, content: q.content, answers: q.answers }))
        : [];

      // Phẳng hoá mảng bài học để lấy Prev / Next lesson
      const allLessons = [];
      course.units.forEach(u => u.lessons.forEach(l => allLessons.push(l)));
      
      const idx = allLessons.findIndex(l => l.id === lessonId);
      const prevLesson = idx > 0 ? allLessons[idx - 1] : null;
      const nextLesson = idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

      // Tiến độ bài học hiện tại (lấy từ Map để truyền xuống Progress Bar)
      const lessonProgress = progressMap[lessonId] || null;

      // Lần làm bài tốt nhất
      const bestAttempt = lesson.passScore > 0
        ? await progressModel.getBestAttempt(user.id, lessonId)
        : null;

      const flatComments = await commentModel.findByLessonId(lessonId);
      const commentTree = learnInteraction.buildCommentTree(flatComments);

      res.render('client/course/learn', {
        title: `${lesson.name} – E-learn`,
        course,
        lesson,
        lesson_documents: lesson.documents || [],
        lessonProgress,
        bestAttempt,
        questions: questionsForView,
        comments: commentTree,
        prevLesson,
        nextLesson,
        user,
        commentMaxLength: learnInteraction.COMMENT_MAX_LENGTH,
      });
    } catch (error) {
      console.error('Lỗi trang học:', error.message);
      res.status(500).render('errors/500', { layout: false, message: error.message });
    }
  },
  markComplete: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      const { progressModel } = await import('../../models/progress.model.js');
      await progressModel.markComplete(user.id, parseInt(req.params.lessonId));
      return res.json({ success: true });
    } catch (error) {
      console.error('Lỗi đánh dấu hoàn thành:', error.message);
      return res.status(500).json({ success: false });
    }
  },

  updateProgress: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) return res.status(401).json({ success: false });
      const { progressModel } = await import('../../models/progress.model.js');
      const raw = req.body?.watchPercent;
      if (raw === undefined || raw === null || Number.isNaN(Number(raw))) {
        return res.status(400).json({ success: false, message: 'Dữ liệu tiến độ không hợp lệ' });
      }
      let pct = Number(raw);
      if (!Number.isFinite(pct)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu tiến độ không hợp lệ' });
      }
      pct = Math.min(100, Math.max(0, Math.round(pct)));
      const lastSec = Math.max(0, parseInt(req.body?.lastPositionSec, 10) || 0);
      await progressModel.upsertProgress(user.id, parseInt(req.params.lessonId, 10), {
        watchPercent: pct,
        lastPositionSec: lastSec,
      });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  },

  submitQuiz: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

      // 1. KIỂM TRA CHẶT CHẼ PARAM TỪ URL (Chống NaN nã vào DB ngay từ bước đầu)
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(lessonId)) {
        return res.status(400).json({ success: false, message: 'ID bài học không hợp lệ' });
      }

      const { lessonModel } = await import('../../models/lesson.model.js');
      const { progressModel } = await import('../../models/progress.model.js');

      // Lúc này lessonId đã an toàn 100% là số nguyên
      const lesson = await lessonModel.findById(lessonId);
      if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });

      const questions = lesson.questionsList || [];
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: 'Bài học không có câu hỏi' });
      }

      const submittedAnswers = req.body.answers || {};
      let correct = 0;
      
      const results = questions.map((q, idx) => {
        const parsedAnswer = parseInt(submittedAnswers[idx]);
        const submitted = isNaN(parsedAnswer) ? -1 : parsedAnswer;
        const correctAnswer = parseInt(q.correctAnswer);

        const isCorrect = submitted === correctAnswer;
        if (isCorrect) correct++;

        return { isCorrect, correctAnswer, submitted };
      });

      // 2. TÍNH ĐIỂM (Đã an toàn)
      let rawScore = (correct / questions.length) * 100;
      let score = (!isNaN(rawScore) && isFinite(rawScore)) ? Math.round(rawScore) : 0;

      const passScore = parseInt(lesson.passScore) || 0;
      const isPassed = score >= passScore;

      // 3. ÉP KIỂU BOOLEAN THÀNH SỐ NGUYÊN (1 hoặc 0) 
      // Đây là mấu chốt để Database viết bằng Go không bị sập khi parse cú pháp
      const isPassedInt = isPassed ? 1 : 0;

      // Log để bạn dễ dàng kiểm tra dữ liệu trước khi vào DB
      console.log(`Lưu DB -> User: ${user.id}, Lesson: ${lessonId}, Score: ${score}, isPassedInt: ${isPassedInt}`);

      // 4. Lưu với biến isPassedInt thay vì isPassed
      await progressModel.saveAttempt(user.id, lessonId, score, isPassedInt);
      
      if (isPassed) {
        // Hàm markComplete không có biến boolean nên vẫn an toàn
        await progressModel.markComplete(user.id, lessonId);
      }

      // Trả JSON về cho Client vẫn dùng boolean `isPassed` để UI dễ xử lý
      return res.json({ success: true, score, isPassed, correct, total: questions.length, results, passScore });
      
    } catch (error) {
      console.error('Lỗi nộp bài:', error.message);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi trên máy chủ khi chấm bài.' });
    }
  },
  postComment: async (req, res) => {
    try {
      // 1. Lấy user từ locals
      const user = res.locals.user;

      // Xử lý báo lỗi 401 nếu dùng AJAX mà chưa đăng nhập
      if (!user) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để bình luận' });
        }
        return res.redirect('/login');
      }

      const { commentModel } = await import('../../models/comment.model.js');
      const { courseId, lessonId } = req.params;
      const { content, parentId } = req.body;

      const validated = learnInteraction.validateCommentContent(content);
      if (!validated.ok) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.status(400).json({ success: false, message: validated.error });
        }
        return res.redirect(`/learn/${courseId}/${lessonId}#tab-comments`);
      }

      const parsedParentId = parentId ? parseInt(parentId, 10) : null;
      const lessonIdNum = parseInt(lessonId, 10);

      if (parsedParentId) {
        const parent = await commentModel.findById(parsedParentId);
        const badParent =
          !parent ||
          Number(parent.isDeleted) === 1 ||
          Number(parent.lessonId) !== lessonIdNum;
        if (badParent) {
          if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(400).json({
              success: false,
              message: 'Bình luận gốc không còn tồn tại hoặc không thuộc bài học này.',
            });
          }
          return res.redirect(`/learn/${courseId}/${lessonId}#tab-comments`);
        }
      }

      const commentId = await commentModel.create(
        user.id,
        lessonIdNum,
        validated.trimmed,
        parsedParentId
      );
      const newComment = await commentModel.findById(commentId);

      // 3. Trả về JSON cho Frontend
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(200).json({
          success: true,
          comment: {
            id: newComment.id,
            content: newComment.content,
            createdAt: newComment.createdAt,
            parentId: parsedParentId, // CỰC KỲ QUAN TRỌNG ĐỂ JS BIẾT LÀ REPLY
            // SỬ DỤNG biến 'user' đã định nghĩa ở trên, KHÔNG dùng req.user
            username: user.fullname || user.username || 'Người dùng',
            avatar: user.avatar || null
          }
        });
      }

      // 4. Nếu tắt JS (Fallback truyền thống)
      return res.redirect(`/learn/${courseId}/${lessonId}#tab-comments`);

    } catch (error) {
      console.error(error);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại.' });
      }
      return res.redirect('back');
    }
  },

  reportComment: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) return res.status(401).json({ success: false });
      const { commentModel } = await import('../../models/comment.model.js');
      const { reason } = req.body;
      if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do' });
      await commentModel.createReport(parseInt(req.params.commentId), user.id, reason.trim());
      return res.json({ success: true });
    } catch (error) {
      console.error('Lỗi báo cáo bình luận:', error.message);
      return res.status(500).json({ success: false });
    }
  },
  deleteComment: async (req, res) => {
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      }

      const { commentModel } = await import('../../models/comment.model.js');
      const { commentId } = req.params;

      // 1. Kiểm tra xem bình luận có tồn tại không
      const comment = await commentModel.findById(commentId);
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
      }

      // 2. Kiểm tra quyền: Chỉ cho phép người tạo bình luận được xóa
      if (comment.userId !== user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
      }

      // 3. Thực hiện Soft Delete (ẩn bình luận)
      const isDeleted = await commentModel.hide(commentId);

      if (isDeleted) {
        return res.json({ success: true, message: 'Đã xóa bình luận' });
      } else {
        return res.status(400).json({ success: false, message: 'Không thể xóa bình luận' });
      }

    } catch (error) {
      console.error('Lỗi xóa bình luận:', error.message);
      return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại.' });
    }
  },
};

module.exports = learnController;
