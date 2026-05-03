'use strict';
const crypto = require('crypto');
const userModel = require('../models/user.model');
const database = require('../config/db');

const hashPassword = (p) => crypto.createHash('sha256').update(p).digest('hex');

const userService = {
  /**
   * Lấy thông tin chi tiết user cùng với các thống kê
   */
  getUserProfile: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) return null;

    // Lấy số lượng khóa học đã đăng ký
    const [enrollCountRows] = await database.execute(
      'SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND status = "active"',
      [userId]
    );

    // Lấy số lượng bài học đã hoàn thành
    const [progressCountRows] = await database.execute(
      'SELECT COUNT(*) as count FROM lesson_progress WHERE userId = ? AND isCompleted = 1',
      [userId]
    );

    // Lấy danh sách các khóa học đang học (tối đa 5)
    const [enrolledCourses] = await database.execute(
      `SELECT c.id, c.name, c.banner, e.createdAt as enrolledAt
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE e.userId = ? AND e.status = "active"
       ORDER BY e.createdAt DESC
       LIMIT 5`,
      [userId]
    );

    return {
      ...user,
      stats: {
        enrolledCount: enrollCountRows[0].count,
        completedLessonsCount: progressCountRows[0].count
      },
      enrolledCourses
    };
  },

  /**
   * Cập nhật thông tin profile
   */
  updateProfile: async (userId, data) => {
    // Nếu có email mới, kiểm tra xem có bị trùng không
    if (data.email) {
      const existingEmail = await userModel.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new Error('Email này đã được sử dụng bởi một tài khoản khác.');
      }
    }

    await userModel.updateProfile(userId, {
      email: data.email,
      avatar: data.avatar
    });
  },

  /**
   * Thay đổi mật khẩu
   */
  changePassword: async (userId, { oldPassword, newPassword }) => {
    const user = await database.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ).then(([rows]) => rows[0]);

    if (!user) throw new Error('Người dùng không tồn tại.');

    if (user.password !== hashPassword(oldPassword)) {
      throw new Error('Mật khẩu cũ không chính xác.');
    }

    const hashedNewPassword = hashPassword(newPassword);
    await userModel.updatePassword(userId, hashedNewPassword);
  }
};

module.exports = userService;
