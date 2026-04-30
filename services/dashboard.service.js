const database = require("../config/db.js");

const dashboardService = {
  // Lấy khóa học có nhiều lượt đăng ký nhất
  getMostRegisteredCourse: async (period = 'all') => {
    let query = `
      SELECT c.name, c.banner as image, COUNT(e.id) as students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.courseId
      WHERE c.deletedAt IS NULL AND c.status = 'active'
    `;
    
    if (period === 'month') {
      query += ` AND MONTH(e.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(e.createdAt) = YEAR(CURRENT_DATE())`;
    }
    
    query += ` GROUP BY c.id ORDER BY students DESC LIMIT 1`;
    
    const [rows] = await database.execute(query);
    return rows[0] || null;
  },

  // Lấy khóa học đánh giá cao nhất
  getTopRatedCourse: async (period = 'all') => {
    let query = `
      SELECT c.name, c.banner as image, ROUND(AVG(r.ratingNum), 1) as rating, COUNT(r.id) as reviews
      FROM courses c
      JOIN reviews r ON c.id = r.courseId
      WHERE c.deletedAt IS NULL AND c.status = 'active'
    `;
    
    if (period === 'month') {
      query += ` AND MONTH(r.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(r.createdAt) = YEAR(CURRENT_DATE())`;
    }
    
    query += ` GROUP BY c.id ORDER BY rating DESC, reviews DESC LIMIT 1`;
    
    const [rows] = await database.execute(query);
    return rows[0] || null;
  },

  // Lấy nội dung có tương tác (bình luận) cao nhất
  getTopCommentedContent: async (period = 'all') => {
    let query = `
      SELECT l.name, 'lesson' as type, COUNT(c.id) as comments
      FROM lessons l
      JOIN comments c ON l.id = c.lessonId
      WHERE l.deletedAt IS NULL AND c.isDeleted = 0
    `;
    
    if (period === 'month') {
      query += ` AND MONTH(c.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(c.createdAt) = YEAR(CURRENT_DATE())`;
    }
    
    query += ` GROUP BY l.id ORDER BY comments DESC LIMIT 1`;
    
    const [rows] = await database.execute(query);
    return rows[0] || null;
  },
  getNewestUpdates: async () => {
    const query = `
      (SELECT name, 'Khóa học' as type, 
              CASE WHEN deletedAt IS NOT NULL THEN deletedAt ELSE COALESCE(updatedAt, createdAt) END as time, 
              CASE WHEN deletedAt IS NOT NULL THEN 'deleted' ELSE status END as status 
       FROM courses)
      UNION ALL
      (SELECT name, 'Chương' as type, 
              CASE WHEN deletedAt IS NOT NULL THEN deletedAt ELSE COALESCE(updatedAt, createdAt) END as time, 
              CASE WHEN deletedAt IS NOT NULL THEN 'deleted' ELSE status END as status 
       FROM units)
      UNION ALL
      (SELECT name, 'Bài học' as type, 
              CASE WHEN deletedAt IS NOT NULL THEN deletedAt ELSE COALESCE(updatedAt, createdAt) END as time, 
              CASE WHEN deletedAt IS NOT NULL THEN 'deleted' ELSE status END as status 
       FROM lessons)
      ORDER BY time DESC
      LIMIT 5
    `;
    const [rows] = await database.execute(query);
    return rows;
  }
};

module.exports = dashboardService;
