const router = require('express').Router()
const breadcrumb = require("../../middlewares/breadcrumb.middleware")
const requireAdmin = require("../../middlewares/auth.middleware")
const courseRoute = require("./course.route")
const unitRoute = require("./unit.route").default || require("./unit.route")
const lessonRoute = require("./lesson.route")
const trashRoute = require("./trash.route")
const authRoute = require("./auth.route")
const profileRoute = require("./profile.route")
const auditLogRoute = require("./auditLog.route")

const dashboardService = require("../../services/dashboard.service.js");
const profileController = require("../../controllers/admin/profile.controller");

// Route đăng nhập không cần xác thực
router.use("/auth", authRoute)

// Tất cả các route bên dưới yêu cầu đăng nhập
router.use(requireAdmin)
router.use(breadcrumb)

router.get("/dashboard", async (req, res) => {
  try {
    const period = req.query.period === 'month' ? 'month' : 'all';
    
    // Đọc dữ liệu từ DB cho thống kê
    const [mostRegistered, topRated, topCommented, newestUpdates] = await Promise.all([
      dashboardService.getMostRegisteredCourse(period),
      dashboardService.getTopRatedCourse(period),
      dashboardService.getTopCommentedContent(period),
      dashboardService.getNewestUpdates()
    ]);

    // Xử lý time format cho updates (tính khoảng cách thời gian)
    const formatTimeAgo = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const diffMs = new Date() - date;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Vừa mới cập nhật';
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      return `${Math.floor(diffHrs / 24)} ngày trước`;
    };

    const formattedUpdates = newestUpdates.map(u => ({
      name: u.name,
      type: u.type,
      time: formatTimeAgo(u.time),
      status: u.status
    }));

    const defaultImage = "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    const stats = {
      mostRegisteredCourse: mostRegistered ? {
        name: mostRegistered.name,
        students: mostRegistered.students,
        image: mostRegistered.image || defaultImage
      } : { name: "Chưa có dữ liệu", students: 0, image: defaultImage },
      
      topRatedCourse: topRated ? {
        name: topRated.name,
        rating: topRated.rating,
        reviews: topRated.reviews,
        image: topRated.image || defaultImage
      } : { name: "Chưa có dữ liệu", rating: "0.0", reviews: 0, image: defaultImage },
      
      topCommented: topCommented ? {
        name: topCommented.name,
        type: topCommented.type === 'lesson' ? 'Bài học' : topCommented.type,
        comments: topCommented.comments
      } : { name: "Chưa có dữ liệu", type: "N/A", comments: 0 },
      
      newestUpdates: formattedUpdates.length > 0 ? formattedUpdates : [
        { name: "Chưa có cập nhật nào", type: "Hệ thống", time: "Gần đây", status: "hidden" }
      ]
    };

    res.render("admin/dashboard", {
      title: "Tổng quan thống kê",
      stats,
      period
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu dashboard:", error);
    res.status(500).send("Lỗi Server");
  }
});
router.use("/course", courseRoute)
router.use("/unit", unitRoute)
router.use("/lesson", lessonRoute)
router.use("/trash", trashRoute)
router.use("/profile", profileRoute)
router.use("/audit-logs", auditLogRoute)
router.get("/settings", profileController.settingsPage)
router.post("/settings", profileController.updateSettings)

module.exports = router