
import database from "../config/db.js";

export const courseModel = {
  findAll: async (keyword = '', status = '', time = '', students = '', page = 1, limit = 10) => {
    let query = `
      SELECT c.*, (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) AS studentCount 
      FROM courses c 
      WHERE c.deletedAt IS NULL
    `;
    const params = [];
    if (keyword) {
      query += ` AND c.name LIKE ?`;
      params.push(`%${keyword}%`);
    }
    if (status) {
      const statusArr = status.split(',');
      const placeholders = statusArr.map(() => '?').join(',');
      query += ` AND c.status IN (${placeholders})`;
      params.push(...statusArr);
    }
    if (time === 'this_month') {
      query += ` AND c.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')`;
    } else if (time === '3_months') {
      query += ` AND c.createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH)`;
    } else if (time === 'this_year') {
      query += ` AND c.createdAt >= DATE_FORMAT(NOW(), '%Y-01-01')`;
    }
    if (students === 'gt_1000') {
      query += ` HAVING studentCount > 1000`;
    } else if (students === '100_500') {
      query += ` HAVING studentCount BETWEEN 100 AND 500`;
    }
    query += ` ORDER BY c.createdAt DESC, c.id DESC`;

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const [countResult] = await database.execute(countQuery, params);
    const totalItems = countResult[0].total;

    const offset = (page - 1) * limit;
    query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [rows] = await database.execute(query, params);
    return {
      data: rows,
      totalItems: totalItems
    };
  },

  findById: async (id) => {
    const [rows] = await database.execute('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0];
  },

  update: async (id, data) => {
    let query = 'UPDATE courses SET ';
    const params = [];
    const setValues = [];

    if (data.title !== undefined) {
      setValues.push('name = ?'); // Trong view dùng name, gửi lên form là title
      params.push(data.title);
    }
    if (data.status !== undefined) {
      setValues.push('status = ?');
      params.push(data.status);
    }
    if (data.description !== undefined) {
      setValues.push('description = ?');
      params.push(data.description);
    }
    if (data.banner !== undefined) {
      setValues.push('banner = ?');
      params.push(data.banner);
    }

    if (setValues.length === 0) return true; // Không có trường nào để cập nhật

    query += setValues.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await database.execute(query, params);
    return result.affectedRows > 0;
  },

  create: async (data) => {
    const query = `
      INSERT INTO courses (name, status, description, banner)
      VALUES (?, ?, ?, ?)
    `;
    const params = [
      data.title || null,
      data.status || 'hidden',
      data.description || null,
      data.banner || null
    ];

    const [result] = await database.execute(query, params);
    return result.insertId;
  },

  findDeleted: async () => {
    const query = `
      SELECT c.*, (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) AS studentCount 
      FROM courses c 
      WHERE c.deletedAt IS NOT NULL
      ORDER BY c.deletedAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  softDelete: async (id) => {
    const query = `UPDATE courses SET deletedAt = NOW() WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result.affectedRows > 0;
  },

  restore: async (id) => {
    const query = `UPDATE courses SET deletedAt = NULL WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result.affectedRows > 0;
  },

  findPublic: async () => {
    const query = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) AS studentCount,
        (SELECT ROUND(AVG(r.ratingNum), 1) FROM reviews r WHERE r.courseId = c.id) AS avgRating,
        (SELECT COUNT(*) FROM reviews r WHERE r.courseId = c.id) AS reviewCount
      FROM courses c
      WHERE c.deletedAt IS NULL
        AND c.status IN ('active', 'locked')
      ORDER BY
        FIELD(c.status, 'active', 'locked'),
        c.createdAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  findCourseDetail: async (id, userId = null) => {
    // 1. Lấy thông tin khóa học (Giữ nguyên)
    const [courseRows] = await database.execute(`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) AS studentCount,
        (SELECT ROUND(AVG(r.ratingNum), 1) FROM reviews r WHERE r.courseId = c.id) AS avgRating,
        (SELECT COUNT(*) FROM reviews r WHERE r.courseId = c.id) AS reviewCount
      FROM courses c
      WHERE c.id = ? AND c.deletedAt IS NULL
    `, [id]);
    if (!courseRows[0]) return null;
    const course = courseRows[0];

    if (!course.curriculumId) {
      course.units = [];
      return course;
    }

    // 2. Lấy thông tin các chương (Giữ nguyên)
    const [units] = await database.execute(`
      SELECT u.id, u.name, u.status, cu.position
      FROM units u
      JOIN curriculum_units cu ON cu.unitId = u.id
      WHERE cu.curriculumId = ? AND u.status != 'hidden' AND u.deletedAt IS NULL
      ORDER BY cu.position ASC, u.id ASC
    `, [course.curriculumId]);

    // 3. TỐI ƯU: Lấy TẤT CẢ bài học của toàn bộ khóa học trong 1 truy vấn (Giải quyết N+1 Query)
    // Áp dụng LEFT JOIN lesson_progress để lấy trạng thái hoàn thành ngay lập tức
    const [allLessons] = await database.execute(`
      SELECT 
          l.id, l.name, l.learnMode, l.status, l.passScore, 
          ul.unitId, ul.position,
          COALESCE(lp.isCompleted, 0) AS isCompleted,
          COALESCE(lp.watchPercent, 0) AS watchPercent,
          COALESCE(lp.lastPositionSec, 0) AS lastPositionSec
      FROM lessons l
      JOIN unit_lessons ul ON ul.lessonId = l.id
      LEFT JOIN lesson_progress lp ON lp.lessonId = l.id AND lp.userId = ?
      WHERE ul.curriculumId = ? AND l.status != 'hidden' AND l.deletedAt IS NULL
      ORDER BY ul.position ASC, l.id ASC
    `, [userId || 0, course.curriculumId]); // Nếu chưa đăng nhập thì userId = 0 (an toàn)

    // 4. Nhóm các bài học vào từng chương tương ứng bằng JavaScript
    units.forEach(unit => {
      // Ép kiểu isCompleted về Boolean cho frontend dễ xử lý
      unit.lessons = allLessons
        .filter(lesson => lesson.unitId === unit.id)
        .map(lesson => ({
          ...lesson,
          isCompleted: Boolean(lesson.isCompleted)
        }));
    });

    course.units = units;
    return course;
  },
  enrollUser: async (userId, courseId) => {
    const query = `INSERT INTO enrollments (userId, courseId) VALUES (?, ?)`;
    const [result] = await database.execute(query, [userId, courseId]);
    return result.affectedRows > 0;
  },
  findUserCourse: async (userId, courseId) => {
    const query = `SELECT * FROM enrollments WHERE userId = ? AND courseId = ?`;
    const [rows] = await database.execute(query, [userId, courseId]);
    return rows[0];
  },
  findEnrolledByUser: async (userId) => {
    const query = `
      SELECT
        c.id, c.name, c.banner, c.status, c.curriculumId,
        e.createdAt AS enrolledAt,
        (
          SELECT COUNT(*)
          FROM unit_lessons ul
          JOIN lessons l ON ul.lessonId = l.id
          WHERE ul.curriculumId = c.curriculumId
            AND l.status IN ('active', 'locked') /* CHỈ TÍNH BÀI ACTIVE/LOCKED */
            AND l.deletedAt IS NULL
        ) AS totalLessons,
        (
          SELECT COUNT(*)
          FROM lesson_progress lp
          JOIN unit_lessons ul ON ul.lessonId = lp.lessonId
          JOIN lessons l ON ul.lessonId = l.id
          WHERE lp.userId = ? 
            AND ul.curriculumId = c.curriculumId 
            AND lp.isCompleted = 1
            AND l.status IN ('active', 'locked') /* CHỈ TÍNH BÀI ACTIVE/LOCKED ĐÃ HOÀN THÀNH */
            AND l.deletedAt IS NULL
        ) AS completedLessons
      FROM enrollments e
      JOIN courses c ON c.id = e.courseId
      WHERE e.userId = ? AND e.status = 'active' AND c.deletedAt IS NULL
      ORDER BY e.createdAt DESC
    `;
    const [rows] = await database.execute(query, [userId, userId]);
    return rows;
  },

  findFirstUncompletedLesson: async (userId, courseId) => {
    // 1. Cố gắng tìm bài học ĐẦU TIÊN mà user CHƯA hoàn thành (chỉ lấy bài Active)
    const uncompletedQuery = `
      SELECT l.id AS lessonId
      FROM unit_lessons ul
      JOIN lessons l ON l.id = ul.lessonId
      LEFT JOIN lesson_progress lp ON lp.lessonId = ul.lessonId AND lp.userId = ?
      WHERE ul.curriculumId = (
        SELECT curriculumId FROM courses WHERE id = ? AND deletedAt IS NULL
      )
      AND l.status = 'active' /* CHỈ LẤY BÀI ACTIVE */
      AND l.deletedAt IS NULL
      AND (lp.isCompleted IS NULL OR lp.isCompleted = 0)
      ORDER BY ul.position ASC, ul.id ASC
      LIMIT 1
    `;
    const [uncompletedRows] = await database.execute(uncompletedQuery, [userId, courseId]);
    
    // Nếu tìm thấy bài chưa học, trả về ngay
    if (uncompletedRows && uncompletedRows.length > 0) {
      return uncompletedRows[0];
    }

    // 2. NẾU KHÔNG TÌM THẤY (nghĩa là đã học hết hoặc khóa học không có bài chưa học):
    // Tìm bài học CUỐI CÙNG mà user ĐÃ HOÀN THÀNH (chỉ lấy bài Active)
    const completedQuery = `
      SELECT l.id AS lessonId
      FROM unit_lessons ul
      JOIN lessons l ON l.id = ul.lessonId
      JOIN lesson_progress lp ON lp.lessonId = ul.lessonId AND lp.userId = ?
      WHERE ul.curriculumId = (
        SELECT curriculumId FROM courses WHERE id = ? AND deletedAt IS NULL
      )
      AND l.status = 'active' /* CHỈ LẤY BÀI ACTIVE */
      AND l.deletedAt IS NULL
      AND lp.isCompleted = 1
      ORDER BY ul.position DESC, ul.id DESC /* Lấy từ dưới lên trên */
      LIMIT 1
    `;
    const [completedRows] = await database.execute(completedQuery, [userId, courseId]);
    
    // Trả về bài đã hoàn thành cuối cùng, hoặc null nếu khóa học hoàn toàn trống
    return completedRows[0] || null;
  },
  checkCourseCompletion: async (userId, courseId) => {
    const query = `
      SELECT
        c.id, c.name,
        (
          SELECT COUNT(*)
          FROM unit_lessons ul
          JOIN lessons l ON ul.lessonId = l.id
          WHERE ul.curriculumId = c.curriculumId
            AND l.status IN ('active', 'locked')
            AND l.deletedAt IS NULL
        ) AS totalLessons,
        (
          SELECT COUNT(*)
          FROM lesson_progress lp
          JOIN unit_lessons ul ON ul.lessonId = lp.lessonId
          JOIN lessons l ON ul.lessonId = l.id
          WHERE lp.userId = ? 
            AND ul.curriculumId = c.curriculumId 
            AND lp.isCompleted = 1
            AND l.status IN ('active', 'locked')
            AND l.deletedAt IS NULL
        ) AS completedLessons,
        (
          SELECT MAX(lp.completedAt)
          FROM lesson_progress lp
          JOIN unit_lessons ul ON ul.lessonId = lp.lessonId
          JOIN lessons l ON ul.lessonId = l.id
          WHERE lp.userId = ? 
            AND ul.curriculumId = c.curriculumId 
            AND lp.isCompleted = 1
        ) AS completedDate
      FROM courses c
      JOIN enrollments e ON c.id = e.courseId
      WHERE c.id = ? AND e.userId = ? AND e.status = 'active' AND c.deletedAt IS NULL
    `;
    // Truyền tham số theo đúng thứ tự dấu ? (userId, userId, courseId, userId)
    const [rows] = await database.execute(query, [userId, userId, courseId, userId]);
    return rows[0] || null;
  },
};
