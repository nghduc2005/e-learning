import { lessonModel } from "../models/lesson.model.js";
import { lessonDto } from "../dtos/lesson.dto.js";

export const lessonService = {
  getLessonList: async (keyword, statusFilter, timeFilter, page = 1, limit = 5) => {
    try {
      const offset = (page - 1) * limit;

      const totalItems = await lessonModel.countLessonList(keyword, statusFilter, timeFilter);
      const totalPages = Math.ceil(totalItems / limit);

      const lessonsData = await lessonModel.getLessonList(
        keyword, statusFilter, timeFilter, limit, offset
      );

      const formattedLessons = lessonsData.map(l => lessonDto(l, false));

      return {
        lessons: formattedLessons,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      throw error;
    }
  },

  createLesson: async (data) => {
    try {
      return await lessonModel.createLesson(data);
    } catch (error) {
      throw error;
    }
  },

  getLessonById: async (id) => {
    try {
      return await lessonModel.getLessonById(id);
    } catch (error) {
      throw error;
    }
  },

  updateLesson: async (id, data) => {
    try {
      return await lessonModel.updateLesson(id, data);
    } catch (error) {
      throw error;
    }
  },

  getDeletedLessons: async () => {
    try {
      const lessons = await lessonModel.getDeletedLessons();
      return lessons.map(lesson => lessonDto(lesson, true));
    } catch (error) {
      throw error;
    }
  },

  deleteLesson: async (id) => {
    try {
      return await lessonModel.softDelete(id);
    } catch (error) {
      throw error;
    }
  },

  restoreLesson: async (id) => {
    try {
      return await lessonModel.restore(id);
    } catch (error) {
      throw error;
    }
  }
};
