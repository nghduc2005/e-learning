const router = require('express').Router();
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const courseController = require('../../controllers/client/course.controller');
const learnController  = require('../../controllers/client/learn.controller');
const { userAuth } = require('../../middlewares/userAuth.middleware');

// Gắn thông tin user (nếu có) vào res.locals cho mọi route client
router.use(userAuth);

router.use('/', authRoute);
router.use('/', userRoute);

// Trang chủ & khóa học
router.get('/', courseController.homepage);
router.get('/courses/:id', courseController.detail);
router.post('/courses/:id/review', courseController.submitReview);
router.post('/courses/:id/enroll', courseController.enrollCourse);

// Học bài
router.get('/learn/:courseId/:lessonId', learnController.lessonPage);
router.post('/learn/:courseId/:lessonId/complete', learnController.markComplete);
router.post('/learn/:courseId/:lessonId/progress', learnController.updateProgress);
router.post('/learn/:courseId/:lessonId/quiz', learnController.submitQuiz);
router.post('/learn/:courseId/:lessonId/comments', learnController.postComment);
router.post('/learn/:courseId/:lessonId/comments/:commentId/report', learnController.reportComment);
router.delete('/learn/:courseId/:lessonId/comments/:commentId', learnController.deleteComment);

module.exports = router;
