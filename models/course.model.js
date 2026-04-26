
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
    query += ` ORDER BY c.createdAt DESC`;

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
  }
};
