'use strict';
const crypto = require('crypto');
const userService = require('../../services/user.service');
const certificateModel = require('../../models/certificate.model');

const userController = {
  /**
   * Hiển thị trang profile cá nhân
   */
  profile: async (req, res) => {
    try {
      const userId = req.user.id;
      const profileData = await userService.getUserProfile(userId);
      
      res.render('client/user/profile', {
        title: 'Trang cá nhân',
        user: profileData,
        error: req.query.error || null,
        success: req.query.success || null
      });
    } catch (err) {
      console.error('Lỗi khi lấy thông tin profile:', err);
      res.redirect('/?error=something_went_wrong');
    }
  },

  /**
   * Xử lý cập nhật profile
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { email } = req.body;
      
      // Xử lý avatar nếu có upload (giả sử dùng multer và upload lên cloudinary)
      const avatar = req.file ? req.file.path : undefined;

      await userService.updateProfile(userId, { email, avatar });
      
      res.redirect('/profile?success=profile_updated');
    } catch (err) {
      console.error('Lỗi khi cập nhật profile:', err);
      res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
    }
  },

  /**
   * Danh sách khoá học đã đăng ký
   */
  myCourses: async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.redirect('/login');
      const { courseModel } = await import('../../models/course.model.js');
      const { progressModel } = await import('../../models/progress.model.js');

      const rows = await courseModel.findEnrolledByUser(user.id);

      // Lấy bài học tiếp theo cho từng khoá
      const courses = await Promise.all(rows.map(async (c) => {
        const next = await courseModel.findFirstUncompletedLesson(user.id, c.id);
        return {
          id: c.id,
          name: c.name,
          banner: c.banner,
          status: c.status,
          enrolledAt: c.enrolledAt,
          totalLessons: c.totalLessons || 0,
          completedLessons: c.completedLessons || 0,
          progress: c.totalLessons > 0 ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0,
          nextLessonId: next ? next.lessonId : null,
        };
      }));

      res.render('client/user/my-courses', {
        title: 'Khoá học của tôi – E-learn',
        user,
        courses,
      });
    } catch (err) {
      console.error('Lỗi my-courses:', err);
      res.redirect('/?error=something_went_wrong');
    }
  },

  /**
   * Xử lý đổi mật khẩu
   */
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      if (newPassword !== confirmPassword) {
        return res.redirect('/profile?error=password_mismatch');
      }

      if (newPassword.length < 6) {
        return res.redirect('/profile?error=password_too_short');
      }

      await userService.changePassword(userId, { oldPassword, newPassword });
      
      res.redirect('/profile?success=password_changed');
    } catch (err) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
    }
  },
  viewCertificate: async (req, res) => {
    try {
      const user = req.user; 
      if (!user) return res.redirect('/login');

      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) return res.redirect('/my-courses');

      const { courseModel } = await import('../../models/course.model.js');
      
      // Kiểm tra tiến độ khóa học
      const progressData = await courseModel.checkCourseCompletion(user.id, courseId);

      // Nếu không tìm thấy khóa học hoặc chưa đăng ký
      if (!progressData) {
        return res.status(404).render('errors/404', { layout: false, message: 'Không tìm thấy thông tin khoá học.' });
      }

      const total = progressData.totalLessons || 0;
      const completed = progressData.completedLessons || 0;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Bảo mật: Nếu chưa đạt 80% thì chặn lại không cho xem
      if (percent < 80) {
        return res.redirect('/my-courses?error=not_eligible_for_certificate');
      }

      // Tìm hoặc tạo chứng chỉ trong DB
      let cert = await certificateModel.findByUserAndCourse(user.id, courseId);
      if (!cert) {
        const verifyCode = crypto.randomBytes(32).toString('hex');
        await certificateModel.create(user.id, courseId, verifyCode);
        cert = await certificateModel.findByUserAndCourse(user.id, courseId);
      }

      res.render('client/user/certificate', {
        title: `Chứng chỉ - ${progressData.name}`,
        user: user,
        course: progressData,
        issueDate: cert.issuedAt || progressData.completedDate || new Date(),
        percent: percent,
        verifyCode: cert.verifyCode,
        verifyUrl: `${process.env.APP_URL}/certificate/verify/${cert.verifyCode}`,
      });

    } catch (err) {
      console.error('Lỗi lấy chứng chỉ:', err);
      res.redirect('/my-courses?error=something_went_wrong');
    }
  },
  // GET /certificate/verify/:code  (public - không cần đăng nhập)
  verifyCertificate: async (req, res) => {
    try {
      const { code } = req.params;
      const cert = await certificateModel.findByVerifyCode(code);
      if (!cert) {
        return res.status(404).render('errors/404', { layout: false });
      }
      res.render('client/user/verify-certificate', {
        title: 'Xác minh chứng chỉ',
        layout: false,
        cert,
      });
    } catch (err) {
      console.error('Lỗi verify certificate:', err);
      res.redirect('/');
    }
  },
};

module.exports = userController;
