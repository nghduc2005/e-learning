import database from "../config/db.js";

export const progressModel = {
  findByUserLesson: async (userId, lessonId) => {
    const [rows] = await database.execute(
      `SELECT * FROM lesson_progress WHERE userId = ? AND lessonId = ?`,
      [userId, lessonId]
    );
    return rows[0] || null;
  },

  upsertProgress: async (userId, lessonId, { watchPercent = 0, lastPositionSec = 0 }) => {
    await database.execute(`
      INSERT INTO lesson_progress (userId, lessonId, watchPercent, lastPositionSec)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        watchPercent    = GREATEST(VALUES(watchPercent), watchPercent),
        lastPositionSec = VALUES(lastPositionSec),
        updatedAt       = NOW()
    `, [userId, lessonId, watchPercent, lastPositionSec]);
  },

  markComplete: async (userId, lessonId) => {
    await database.execute(`
      INSERT INTO lesson_progress (userId, lessonId, isCompleted, completedAt, watchPercent)
      VALUES (?, ?, 1, NOW(), 100)
      ON DUPLICATE KEY UPDATE
        isCompleted  = 1,
        watchPercent = 100,
        completedAt  = IF(completedAt IS NULL, NOW(), completedAt),
        updatedAt    = NOW()
    `, [userId, lessonId]);
  },

  findByCurriculum: async (userId, curriculumId) => {
    const [rows] = await database.execute(`
      SELECT lp.lessonId, lp.isCompleted, lp.watchPercent, lp.lastPositionSec
      FROM lesson_progress lp
      JOIN unit_lessons ul ON ul.lessonId = lp.lessonId
      WHERE lp.userId = ? AND ul.curriculumId = ?
    `, [userId, curriculumId]);
    return rows;
  },

  saveAttempt: async (userId, lessonId, score, isPassed) => {
    const [result] = await database.execute(`
      INSERT INTO question_attempts (userId, lessonId, score, isPassed)
      VALUES (?, ?, ?, ?)
    `, [userId, lessonId, score, isPassed ? 1 : 0]);
    return result.insertId;
  },

  getBestAttempt: async (userId, lessonId) => {
    const [rows] = await database.execute(`
      SELECT * FROM question_attempts
      WHERE userId = ? AND lessonId = ?
      ORDER BY score DESC, submittedAt DESC
      LIMIT 1
    `, [userId, lessonId]);
    return rows[0] || null;
  },
};
