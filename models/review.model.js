import database from "../config/db.js";

export const reviewModel = {
  findByCourseId: async (courseId) => {
    const query = `
      SELECT
        r.id,
        r.content,
        r.ratingNum,
        r.createdAt,
        u.id   AS userId,
        u.username,
        u.avatar
      FROM reviews r
      JOIN users u ON u.id = r.userId
      WHERE r.courseId = ?
      ORDER BY r.createdAt DESC
    `;
    const [rows] = await database.execute(query, [courseId]);
    return rows;
  },

  hardDelete: async (reviewId) => {
    const [result] = await database.execute(
      `DELETE FROM reviews WHERE id = ?`,
      [reviewId]
    );
    return result.affectedRows > 0;
  },

  create: async (data) => {
    const [result] = await database.execute(
      `INSERT INTO reviews (courseId, userId, content, ratingNum) VALUES (?, ?, ?, ?)`,
      [data.courseId, data.userId, data.content, data.ratingNum]
    );
    return result.insertId;
  },

  findByUserAndCourse: async (userId, courseId) => {
    const [rows] = await database.execute(
      `SELECT id, content, ratingNum, createdAt FROM reviews WHERE userId = ? AND courseId = ?`,
      [userId, courseId]
    );
    return rows[0] || null;
  },
};
