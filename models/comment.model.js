import database from "../config/db.js";

export const commentModel = {
  // Lấy tất cả bình luận của một khóa học (qua curriculum -> unit_lessons -> lessons)
  findByCourseId: async (courseId) => {
    const query = `
      SELECT
        c.id,
        c.content,
        c.isDeleted,
        c.parentId,
        c.createdAt,
        u.id   AS userId,
        u.username,
        u.avatar,
        l.id   AS lessonId,
        l.name AS lessonName,
        pc.content AS parentContent,
        pu.username AS parentUsername
      FROM comments c
      JOIN users   u  ON u.id  = c.userId
      JOIN lessons l  ON l.id  = c.lessonId
      JOIN unit_lessons ul ON ul.lessonId = l.id
      JOIN courses co ON co.curriculumId = ul.curriculumId
      LEFT JOIN comments pc ON pc.id = c.parentId
      LEFT JOIN users   pu ON pu.id  = pc.userId
      WHERE co.id = ?
      ORDER BY c.createdAt DESC
    `;
    const [rows] = await database.execute(query, [courseId]);
    return rows;
  },

  // Lấy tất cả báo cáo bình luận của một khóa học
  findReportsByCourseId: async (courseId) => {
    const query = `
      SELECT
        rc.id          AS reportId,
        rc.reason,
        rc.status      AS reportStatus,
        rc.createdAt   AS reportedAt,
        reporter.id       AS reporterId,
        reporter.username AS reporterName,
        reporter.avatar   AS reporterAvatar,
        c.id           AS commentId,
        c.content      AS commentContent,
        c.isDeleted    AS commentDeleted,
        author.username   AS commentAuthor,
        l.name         AS lessonName
      FROM report_comments rc
      JOIN users   reporter ON reporter.id = rc.reporterId
      JOIN comments c       ON c.id = rc.commentId
      JOIN users   author   ON author.id = c.userId
      JOIN lessons l        ON l.id = c.lessonId
      JOIN unit_lessons ul  ON ul.lessonId = l.id
      JOIN courses co       ON co.curriculumId = ul.curriculumId
      WHERE co.id = ?
      ORDER BY
        FIELD(rc.status, 'pending', 'accept', 'reject'),
        rc.createdAt DESC
    `;
    const [rows] = await database.execute(query, [courseId]);
    return rows;
  },

  // Lấy tất cả bình luận của một bài học
  findByLessonId: async (lessonId) => {
    const query = `
      SELECT
        c.id,
        c.content,
        c.isDeleted,
        c.parentId,
        c.createdAt,
        u.id   AS userId,
        u.username,
        u.avatar,
        pc.content  AS parentContent,
        pu.username AS parentUsername
      FROM comments c
      JOIN users u ON u.id = c.userId
      LEFT JOIN comments pc ON pc.id = c.parentId
      LEFT JOIN users    pu ON pu.id  = pc.userId
      WHERE c.lessonId = ?
      ORDER BY c.createdAt DESC
    `;
    const [rows] = await database.execute(query, [lessonId]);
    return rows;
  },

  // Lấy tất cả báo cáo bình luận của một bài học
  findReportsByLessonId: async (lessonId) => {
    const query = `
      SELECT
        rc.id          AS reportId,
        rc.reason,
        rc.status      AS reportStatus,
        rc.createdAt   AS reportedAt,
        reporter.id       AS reporterId,
        reporter.username AS reporterName,
        reporter.avatar   AS reporterAvatar,
        c.id           AS commentId,
        c.content      AS commentContent,
        c.isDeleted    AS commentDeleted,
        author.username   AS commentAuthor
      FROM report_comments rc
      JOIN users    reporter ON reporter.id = rc.reporterId
      JOIN comments c        ON c.id  = rc.commentId
      JOIN users    author   ON author.id   = c.userId
      WHERE c.lessonId = ?
      ORDER BY
        FIELD(rc.status, 'pending', 'accept', 'reject'),
        rc.createdAt DESC
    `;
    const [rows] = await database.execute(query, [lessonId]);
    return rows;
  },

  // Ẩn bình luận (soft delete)
  hide: async (commentId) => {
    const [result] = await database.execute(
      `UPDATE comments SET isDeleted = 1 WHERE id = ?`,
      [commentId]
    );
    return result.affectedRows > 0;
  },

  // Khôi phục bình luận bị ẩn
  restore: async (commentId) => {
    const [result] = await database.execute(
      `UPDATE comments SET isDeleted = 0 WHERE id = ?`,
      [commentId]
    );
    return result.affectedRows > 0;
  },

  // Lấy tất cả bình luận đã bị ẩn (dùng cho thùng rác)
  findDeleted: async () => {
    const query = `
      SELECT
        c.id,
        c.content,
        c.createdAt,
        c.parentId,
        u.id   AS userId,
        u.username,
        u.avatar,
        l.id   AS lessonId,
        l.name AS lessonName,
        co.id   AS courseId,
        co.name AS courseName
      FROM comments c
      JOIN users u  ON u.id  = c.userId
      JOIN lessons l ON l.id  = c.lessonId
      JOIN unit_lessons ul ON ul.lessonId = l.id
      JOIN courses co ON co.curriculumId = ul.curriculumId
      WHERE c.isDeleted = 1
      ORDER BY c.createdAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  // Xóa vĩnh viễn bình luận
  hardDelete: async (commentId) => {
    const [result] = await database.execute(
      `DELETE FROM comments WHERE id = ?`,
      [commentId]
    );
    return result.affectedRows > 0;
  },

  // Cập nhật trạng thái báo cáo
  updateReportStatus: async (reportId, status) => {
    const [result] = await database.execute(
      `UPDATE report_comments SET status = ?, updatedAt = NOW() WHERE id = ?`,
      [status, reportId]
    );
    return result.affectedRows > 0;
  },

  // Chấp nhận báo cáo (ẩn): ẩn bình luận + đóng tất cả báo cáo pending của cùng bình luận
  acceptReport: async (reportId) => {
    const [[report]] = await database.execute(
      `SELECT commentId FROM report_comments WHERE id = ?`,
      [reportId]
    );
    if (!report) return false;
    await database.execute(
      `UPDATE comments SET isDeleted = 1 WHERE id = ?`,
      [report.commentId]
    );
    const [result] = await database.execute(
      `UPDATE report_comments SET status = 'accept', updatedAt = NOW() WHERE commentId = ? AND status = 'pending'`,
      [report.commentId]
    );
    return result.affectedRows > 0;
  },

  /** Xử lý báo cáo bằng cách xóa vĩnh viễn bình luận (và báo cáo liên quan do CASCADE) */
  acceptReportAndHardDelete: async (reportId) => {
    const [[report]] = await database.execute(
      `SELECT commentId FROM report_comments WHERE id = ?`,
      [reportId]
    );
    if (!report) return false;
    const [result] = await database.execute(`DELETE FROM comments WHERE id = ?`, [report.commentId]);
    return result.affectedRows > 0;
  },

  /** Toàn bộ bình luận (admin) — kèm khóa học / bài học & số báo cáo chờ */
  findAllForAdmin: async () => {
    const query = `
      SELECT
        c.id,
        c.content,
        c.isDeleted,
        c.parentId,
        c.createdAt,
        u.id   AS userId,
        u.username,
        u.avatar,
        l.id   AS lessonId,
        l.name AS lessonName,
        co.id   AS courseId,
        co.name AS courseName,
        (SELECT COUNT(*) FROM report_comments rc2
         WHERE rc2.commentId = c.id AND rc2.status = 'pending') AS pendingReportsCount
      FROM comments c
      JOIN users u ON u.id = c.userId
      JOIN lessons l ON l.id = c.lessonId
      JOIN unit_lessons ul ON ul.lessonId = l.id
      JOIN courses co ON co.curriculumId = ul.curriculumId
      WHERE co.deletedAt IS NULL
      ORDER BY c.createdAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  /** Báo cáo đang chờ — toàn hệ thống */
  findAllPendingReportsGlobal: async () => {
    const query = `
      SELECT
        rc.id          AS reportId,
        rc.reason,
        rc.status      AS reportStatus,
        rc.createdAt   AS reportedAt,
        reporter.id       AS reporterId,
        reporter.username AS reporterName,
        reporter.avatar   AS reporterAvatar,
        c.id           AS commentId,
        c.content      AS commentContent,
        c.isDeleted    AS commentDeleted,
        author.username   AS commentAuthor,
        l.name         AS lessonName,
        co.id          AS courseId,
        co.name        AS courseName
      FROM report_comments rc
      JOIN users   reporter ON reporter.id = rc.reporterId
      JOIN comments c       ON c.id = rc.commentId
      JOIN users   author   ON author.id = c.userId
      JOIN lessons l        ON l.id = c.lessonId
      JOIN unit_lessons ul  ON ul.lessonId = l.id
      JOIN courses co       ON co.curriculumId = ul.curriculumId
      WHERE rc.status = 'pending' AND co.deletedAt IS NULL
      ORDER BY rc.createdAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  // Từ chối báo cáo
  rejectReport: async (reportId) => {
    const [result] = await database.execute(
      `UPDATE report_comments SET status = 'reject', updatedAt = NOW() WHERE id = ?`,
      [reportId]
    );
    return result.affectedRows > 0;
  },

  // Tạo bình luận mới (client)
  create: async (userId, lessonId, content, parentId = null) => {
    const [result] = await database.execute(
      `INSERT INTO comments (userId, lessonId, content, parentId) VALUES (?, ?, ?, ?)`,
      [userId, lessonId, content, parentId]
    );
    return result.insertId;
  },

  // Báo cáo bình luận (client)
  createReport: async (commentId, reporterId, reason) => {
    const [result] = await database.execute(
      `INSERT INTO report_comments (commentId, reporterId, reason) VALUES (?, ?, ?)`,
      [commentId, reporterId, reason]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await database.execute(`SELECT * FROM comments WHERE id = ?`, [id]);
    return rows[0] || null;
  },
};
