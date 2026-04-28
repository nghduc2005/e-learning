import database from "../config/db.js";

const curriculumModel = {
  getCurriculumByCourseId: async (courseId) => {
    const query = `
      SELECT 
        cu.unitId AS unitId,
        u.name AS unitName,
        u.status AS unitStatus,
        cu.position AS unitPosition,
        ul.lessonId AS lessonId,
        l.name AS lessonName,
        l.status AS lessonStatus,
        ul.position AS lessonPosition
      FROM courses c
      JOIN curriculums curr ON c.curriculumId = curr.id
      JOIN curriculum_units cu ON curr.id = cu.curriculumId
      JOIN units u ON cu.unitId = u.id
      LEFT JOIN unit_lessons ul ON curr.id = ul.curriculumId AND cu.unitId = ul.unitId
      LEFT JOIN lessons l ON ul.lessonId = l.id
      WHERE c.id = ?
      ORDER BY cu.position ASC, ul.position ASC
    `;
    const [rows] = await database.execute(query, [courseId]);
    
    const unitsMap = new Map();
    for (const row of rows) {
      if (!unitsMap.has(row.unitId)) {
        unitsMap.set(row.unitId, {
          id: row.unitId.toString(),
          title: row.unitName,
          status: row.unitStatus,
          order: row.unitPosition,
          lessons: []
        });
      }
      if (row.lessonId) {
        unitsMap.get(row.unitId).lessons.push({
          id: row.lessonId.toString(),
          title: row.lessonName,
          status: row.lessonStatus,
          order: row.lessonPosition
        });
      }
    }
    return Array.from(unitsMap.values());
  },
  saveCurriculum: async (courseId, curriculumData) => {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get course's current curriculumId
      const [courses] = await connection.execute('SELECT curriculumId FROM courses WHERE id = ?', [courseId]);
      if (courses.length === 0) {
        throw new Error('Course not found');
      }

      let curriculumId = courses[0].curriculumId;

      // 2. If course does not have a curriculum, create one
      if (!curriculumId) {
        const [currResult] = await connection.execute('INSERT INTO curriculums (createdAt) VALUES (NOW())');
        curriculumId = currResult.insertId;
        // Update course with new curriculumId
        await connection.execute('UPDATE courses SET curriculumId = ? WHERE id = ?', [curriculumId, courseId]);
      }

      // 3. Clear existing associations for this curriculum
      await connection.execute('DELETE FROM unit_lessons WHERE curriculumId = ?', [curriculumId]);
      await connection.execute('DELETE FROM curriculum_units WHERE curriculumId = ?', [curriculumId]);

      // 4. Insert new structure
      const seenUnits = new Set();
      const seenLessons = new Set();

      for (const unit of curriculumData) {
        if (!unit.id) continue;
        
        if (seenUnits.has(unit.id)) {
          throw new Error(`Chương "${unit.title}" đã được thêm nhiều lần. Mỗi chương chỉ được xuất hiện 1 lần duy nhất!`);
        }
        seenUnits.add(unit.id);
        
        await connection.execute(
          'INSERT INTO curriculum_units (curriculumId, unitId, position) VALUES (?, ?, ?)',
          [curriculumId, unit.id, unit.order]
        );

        if (unit.lessons && unit.lessons.length > 0) {
          for (const lesson of unit.lessons) {
            if (!lesson.id) continue;
            
            if (seenLessons.has(lesson.id)) {
              throw new Error(`Bài học "${lesson.title || 'Không tên'}" đã tồn tại trong chương trình học. Mỗi bài học chỉ được xuất hiện 1 lần duy nhất!`);
            }
            seenLessons.add(lesson.id);
            
            await connection.execute(
              'INSERT INTO unit_lessons (curriculumId, unitId, lessonId, position) VALUES (?, ?, ?, ?)',
              [curriculumId, unit.id, lesson.id, lesson.order]
            );
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default curriculumModel;