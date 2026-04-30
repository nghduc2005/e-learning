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
};
