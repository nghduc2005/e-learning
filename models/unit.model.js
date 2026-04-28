import database from "../config/db.js";

export const unitModel = {
  findAll: async (keyword, statusFilter, sortCondition, limit, offset) => {
    let query = `
      SELECT u.*, (SELECT COUNT(*) FROM unit_lessons ul WHERE ul.unitId = u.id) AS lessonCount 
      FROM units u 
      WHERE u.deletedAt IS NULL
    `;
    const params = [];

    if (keyword) {
      query += ` AND u.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (statusFilter) {
      const statusArray = statusFilter.split(',');
      const placeholders = statusArray.map(() => '?').join(',');
      query += ` AND u.status IN (${placeholders})`;
      params.push(...statusArray);
    }

    if (sortCondition) {
      query += ` ORDER BY ${sortCondition}, u.id DESC`;
    } else {
      query += ` ORDER BY u.createdAt DESC, u.id DESC`;
    }

    if (limit !== undefined && offset !== undefined) {
      query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
    }

    const [rows] = await database.execute(query, params);
    return rows;
  },

  countAll: async (keyword, statusFilter) => {
    let query = `SELECT COUNT(*) as total FROM units u WHERE u.deletedAt IS NULL`;
    const params = [];

    if (keyword) {
      query += ` AND u.name LIKE ?`;
      params.push(`%${keyword}%`);
    }

    if (statusFilter) {
      const statusArray = statusFilter.split(',');
      const placeholders = statusArray.map(() => '?').join(',');
      query += ` AND u.status IN (${placeholders})`;
      params.push(...statusArray);
    }

    const [rows] = await database.execute(query, params);
    return rows[0].total;
  },

  findById: async (id) => {
    const query = `
      SELECT u.*, (SELECT COUNT(*) FROM unit_lessons ul WHERE ul.unitId = u.id) AS lessonCount
      FROM units u 
      WHERE u.id = ? AND u.deletedAt IS NULL
    `;
    const [rows] = await database.execute(query, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const fields = [];
    const params = [];

    if (data.title !== undefined) {
      fields.push("name = ?");
      params.push(data.title);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      params.push(data.status);
    }

    if (fields.length === 0) return true;

    params.push(id);
    const query = `UPDATE units SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await database.execute(query, params);
    return result.affectedRows > 0;
  },

  create: async (data) => {
    const query = `
      INSERT INTO units (name, status)
      VALUES (?, ?)
    `;
    const params = [
      data.title || null,
      data.status || 'hidden'
    ];

    const [result] = await database.execute(query, params);
    return result.insertId;
  },

  softDelete: async (id) => {
    const query = `UPDATE units SET deletedAt = NOW() WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result.affectedRows > 0;
  },

  findDeleted: async () => {
    const query = `
      SELECT u.*, (SELECT COUNT(*) FROM unit_lessons ul WHERE ul.unitId = u.id) AS lessonCount
      FROM units u 
      WHERE u.deletedAt IS NOT NULL
      ORDER BY u.deletedAt DESC
    `;
    const [rows] = await database.execute(query);
    return rows;
  },

  restore: async (id) => {
    const query = `UPDATE units SET deletedAt = NULL WHERE id = ?`;
    const [result] = await database.execute(query, [id]);
    return result.affectedRows > 0;
  }
};
