const courseController = {
  homepage: async (req, res) => {
    try {
      const { courseService } = await import('../../services/course.service.js');
      const courses = await courseService.getPublicCourses();
      const activeCourses = courses.filter(c => c.status === 'active');
      const lockedCourses = courses.filter(c => c.status === 'locked');
      res.render('client/home/index', {
        title: 'Trang chủ – E-learn',
        activeCourses,
        lockedCourses,
        user: res.locals.user || null,
      });
    } catch (error) {
      console.error('Lỗi trang chủ:', error.message);
      res.status(500).render('errors/500', { layout: false, message: error.message });
    }
  },

  detail: async (req, res) => {
    try {
      const { courseService } = await import('../../services/course.service.js');
      const reviewService = (await import('../../services/review.service.js')).default;
      const id = req.params.id;
      const course = await courseService.getCourseDetail(id);
      if (!course) return res.status(404).render('errors/404', { layout: false });
      
      const allReviews = await reviewService.getReviewsByCourseId(id);
      const reviewTotalCount = allReviews.length;

      const rawStar = req.query.reviewStars;
      const reviewFilter =
        rawStar !== undefined && rawStar !== '' && rawStar !== 'all'
          ? parseInt(String(rawStar), 10)
          : null;
      const validFilter =
        reviewFilter !== null && reviewFilter >= 1 && reviewFilter <= 5 ? reviewFilter : null;

      const reviews = validFilter
        ? allReviews.filter((r) => r.ratingNum === validFilter)
        : allReviews;

      const user = res.locals.user || null;
      let userReview = null;
      if (user) {
        userReview = await reviewService.getUserReview(user.id, id);
      }
      const getEnroll = user ? await courseService.getEnrollUser(user.id, id) : null;
      let enroll = false;
      let lessonId = null;
      if (getEnroll) {
        enroll = true;
        lessonId = await courseService.getFirstUncompletedLessonId(user.id, id);
      }

      const ratingDist = [0, 0, 0, 0, 0];
      allReviews.forEach((r) => {
        if (r.ratingNum >= 1 && r.ratingNum <= 5) {
          ratingDist[r.ratingNum - 1]++;
        }
      });

      res.render('client/course/detail', {
        title: `${course.name} – E-learn`,
        course,
        reviews,
        reviewTotalCount,
        reviewFilter: validFilter,
        userReview,
        ratingDist,
        user,
        enroll,
        lessonId,
        enrollSuccess: req.query.success === 'enrolled',
      });
    } catch (error) {
      console.error('Lỗi trang chi tiết khóa học:', error.message);
      res.status(500).render('errors/500', { layout: false, message: error.message });
    }
  },

  submitReview: async (req, res) => {
    try {
      const reviewService = (await import('../../services/review.service.js')).default;
      const user = res.locals.user;
      if (!user) return res.redirect('/login');

      const courseId = req.params.id;
      const { content, ratingNum } = req.body;
      const rating = parseInt(ratingNum, 10);

      if (!rating || rating < 1 || rating > 5) {
        return res.redirect(`/courses/${courseId}?error=invalid_rating`);
      }

      // Check if already reviewed
      const existing = await reviewService.getUserReview(user.id, courseId);
      if (existing) {
        return res.redirect(`/courses/${courseId}?error=already_reviewed`);
      }

      await reviewService.createReview({
        courseId,
        userId: user.id,
        content: content || '',
        ratingNum: rating,
      });

      res.redirect(`/courses/${courseId}#reviews-section`);
    } catch (error) {
      console.error('Lỗi gửi đánh giá:', error.message);
      res.redirect(`/courses/${req.params.id}?error=server`);
    }
  },

  enrollCourse: async (req, res) => {
    try {
      const { courseService } = await import('../../services/course.service.js');
      const user = res.locals.user;
      if (!user) return res.redirect('/login');

      const courseId = req.params.id;
      await courseService.enrollUserToCourse(user.id, courseId);

      res.redirect(`/courses/${courseId}?success=enrolled`);
    } catch (error) {
      console.error('Lỗi tham gia khóa học:', error.message);
      res.redirect(`/courses/${req.params.id}?error=server`);
    }
  },
};

module.exports = courseController;