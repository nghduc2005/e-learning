import database from "../config/db.js";

export const lessonModel = {
  countAll: async (keyword, statusFilter, timeFilter) => {
    let query = `SELECT COUNT(*) as total FROM lessons l WHERE l.deletedAt IS NULL`;
    const params = [];

    if (keyword) {
      query += ` AND l.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (statusFilter) {
      const statuses = statusFilter.split(',');
      const placeholders = statuses.map(() => '?').join(',');
      query += ` AND l.status IN (${placeholders})`;
      params.push(...statuses);
    }

    if (timeFilter) {
      if (timeFilter === 'this_month') {
        query += ` AND MONTH(l.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(l.createdAt) = YEAR(CURRENT_DATE())`;
      } else if (timeFilter === '3_months') {
        query += ` AND l.createdAt >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)`;
      } else if (timeFilter === 'this_year') {
        query += ` AND YEAR(l.createdAt) = YEAR(CURRENT_DATE())`;
      }
    }

    const [rows] = await database.execute(query, params);
    return rows[0].total;
  },

  findAll: async (keyword, statusFilter, timeFilter, limit, offset) => {
    let query = `SELECT l.* FROM lessons l WHERE l.deletedAt IS NULL`;
    const params = [];

    if (keyword) {
      query += ` AND l.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (statusFilter) {
      const statuses = statusFilter.split(',');
      const placeholders = statuses.map(() => '?').join(',');
      query += ` AND l.status IN (${placeholders})`;
      params.push(...statuses);
    }

    if (timeFilter) {
      if (timeFilter === 'this_month') {
        query += ` AND MONTH(l.createdAt) = MONTH(CURRENT_DATE()) AND YEAR(l.createdAt) = YEAR(CURRENT_DATE())`;
      } else if (timeFilter === '3_months') {
        query += ` AND l.createdAt >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)`;
      } else if (timeFilter === 'this_year') {
        query += ` AND YEAR(l.createdAt) = YEAR(CURRENT_DATE())`;
      }
    }

    query += ` ORDER BY l.createdAt DESC, l.id DESC`;

    if (limit !== undefined && offset !== undefined) {
      query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    }

    const [rows] = await database.execute(query, params);
    return rows;
  },

  create: async (data) => {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      const [lessonResult] = await connection.execute(
        `INSERT INTO lessons (name, content, learnMode, status, passScore) VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.content, data.learnMode, data.status, data.passScore]
      );
      const lessonId = lessonResult.insertId;
      
      if (data.document && data.document.length > 0) {
        for (const url of data.document) {
          const rawFileName = url.split('/').pop(); 
          const fileName = rawFileName.replace(/^\d{13}-/, '');
          const fileType = fileName.split('.').pop();
          await connection.execute(
            `INSERT INTO lesson_documents (lessonId, name, url, fileType) VALUES (?, ?, ?, ?)`,
            [lessonId, fileName, url, fileType]
          );
        }
      }
      if (data.questionsList && data.questionsList.length > 0) {
        for (const q of data.questionsList) {
          const [qResult] = await connection.execute(
            `INSERT INTO questions (lessonId, question) VALUES (?, ?)`,
            [lessonId, q.content]
          );
          const questionId = qResult.insertId;

          for (let i = 0; i < q.answers.length; i++) {
            const isCorrect = (i === q.correctAnswer) ? 1 : 0;
            await connection.execute(
              `INSERT INTO answers (questionId, answer, isCorrect) VALUES (?, ?, ?)`,
              [questionId, q.answers[i], isCorrect]
            );
          }
        }
      }

      await connection.commit();
      return lessonId;
    } catch (error) {
      await connection.rollback();
      console.log(error);
      
      throw error;
    } finally {
      connection.release();
    }
  },

  findById: async (id) => {
      const [lessons] = await database.execute(
          `SELECT * FROM lessons WHERE id = ? AND deletedAt IS NULL`, 
          [id]
      );
      if (lessons.length === 0) return null;
      const lesson = lessons[0];
      const [documents] = await database.execute(
          `SELECT id, name, url, fileType FROM lesson_documents WHERE lessonId = ?`,
          [id]
      );
      lesson.documents = documents;
      const [questions] = await database.execute(
          `SELECT id, question as content FROM questions WHERE lessonId = ?`, 
          [id]
      );
      const questionsWithAnswers = await Promise.all(questions.map(async (q) => {
          const [answers] = await database.execute(
              `SELECT answer, isCorrect FROM answers WHERE questionId = ? ORDER BY id ASC`, 
              [q.id]
          );
          
          return {
              id: q.id,
              content: q.content,
              answers: answers.map(a => a.answer),
              correctAnswer: answers.findIndex(a => a.isCorrect === 1)
          };
      }));

      lesson.questionsList = questionsWithAnswers;
      console.log(lesson);
      return lesson;
    },

  update: async (id, data) => {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cập nhật thông tin cơ bản của bài học
      let query = `UPDATE lessons SET name = ?, learnMode = ?, status = ?, passScore = ?`;
      const params = [data.name, data.learnMode, data.status, data.passScore];

      if (data.content) {
        query += `, content = ?`;
        params.push(data.content);
      }

      query += ` WHERE id = ?`;
      params.push(id);
      await connection.execute(query, params);

      // 2. Cập nhật tài liệu đính kèm (lesson_documents)
      // Chỉ thực hiện nếu data.document được gửi lên (kể cả mảng rỗng để xóa hết)
      if (data.document !== undefined) {
        // Xóa tài liệu cũ
        await connection.execute(`DELETE FROM lesson_documents WHERE lessonId = ?`, [id]);
        
        // Thêm tài liệu mới
        if (data.document && data.document.length > 0) {
          for (const url of data.document) {
            const rawFileName = url.split('/').pop(); 
            const fileName = rawFileName.replace(/^\d{13}-/, '');
            const fileType = fileName.split('.').pop();
            await connection.execute(
              `INSERT INTO lesson_documents (lessonId, name, url, fileType) VALUES (?, ?, ?, ?)`,
              [id, fileName, url, fileType]
            );
          }
        }
      }

      // 3. Cập nhật câu hỏi và câu trả lời (Xóa cũ - Thêm mới)
      // Lấy danh sách câu hỏi cũ để xóa câu trả lời liên quan
      const [oldQs] = await connection.execute(`SELECT id FROM questions WHERE lessonId = ?`, [id]);
      for (const oldQ of oldQs) {
        await connection.execute(`DELETE FROM answers WHERE questionId = ?`, [oldQ.id]);
      }
      await connection.execute(`DELETE FROM questions WHERE lessonId = ?`, [id]);

      // Thêm danh sách câu hỏi mới
      if (data.questionsList && data.questionsList.length > 0) {
        for (const q of data.questionsList) {
          const [qResult] = await connection.execute(
            `INSERT INTO questions (lessonId, question) VALUES (?, ?)`,
            [id, q.content]
          );
          const questionId = qResult.insertId;

          for (let i = 0; i < q.answers.length; i++) {
            const isCorrect = (i === q.correctAnswer) ? 1 : 0;
            await connection.execute(
              `INSERT INTO answers (questionId, answer, isCorrect) VALUES (?, ?, ?)`,
              [questionId, q.answers[i], isCorrect]
            );
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.log(error);
      throw error;
    } finally {
      connection.release();
    }
  },

  findDeleted: async () => {
    const query = `SELECT id, name, status, deletedAt FROM lessons WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC`;
    const [rows] = await database.execute(query);
    return rows;
  },

  softDelete: async (id) => {
    const query = `UPDATE lessons SET deletedAt = NOW() WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result;
  },

  restore: async (id) => {
    const query = `UPDATE lessons SET deletedAt = NULL WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result;
  }
};
