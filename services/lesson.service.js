import { lessonModel } from "../models/lesson.model.js";

/**
 * Format raw lesson data into view-friendly format.
 * @param {Object} lesson - The raw lesson object from the database.
 * @param {boolean} [isTrash=false] - Flag indicating if the lesson is in the trash.
 * @returns {Object|null} Formatted lesson object or null if input is falsy.
 */
const formatLesson = (lesson, isTrash = false) => {
  if (!lesson) return null;
  const statusConfig = {
    "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
    "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
    "locked": { text: "Khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
  };
  return {
    id: lesson.id,
    name: lesson.name,
    status: lesson.status,
    statusDisplay: statusConfig[lesson.status] || statusConfig["hidden"],
    createdAt: new Date(lesson.createdAt).toLocaleString('vi-VN'),
    deletedAt: lesson.deletedAt ? new Date(lesson.deletedAt).toLocaleString('vi-VN') : null,
    isTrash: isTrash
  };
};

export const lessonService = {
  /**
   * Retrieves a paginated list of lessons with filtering.
   * @param {string} keyword - Search keyword.
   * @param {string} statusFilter - Filter by status (e.g., 'active', 'hidden').
   * @param {string} timeFilter - Filter by creation time.
   * @param {number} [page=1] - Current page number.
   * @param {number} [limit=5] - Number of items per page.
   * @returns {Promise<Object>} An object containing the formatted lessons array and pagination info.
   */
  getLessonList: async (keyword, statusFilter, timeFilter, page = 1, limit = 5) => {
    const offset = (page - 1) * limit;
    const totalItems = await lessonModel.countAll(keyword, statusFilter, timeFilter);
    const totalPages = Math.ceil(totalItems / limit);
    const lessonsData = await lessonModel.findAll(keyword, statusFilter, timeFilter, limit, offset);

    return {
      lessons: lessonsData.map(l => formatLesson(l, false)),
      pagination: { totalItems, totalPages, currentPage: page, limit }
    };
  },

  /**
   * Creates a new lesson.
   * @param {Object} data - Lesson data payload.
   * @returns {Promise<number>} The ID of the newly created lesson.
   */
  createLesson: async (data) => {
    return await lessonModel.create(data);
  },

  /**
   * Retrieves a lesson by its ID.
   * @param {number|string} id - The ID of the lesson.
   * @returns {Promise<Object>} The raw lesson object.
   */
  getLessonById: async (id) => {
    return await lessonModel.findById(id);
  },

  /**
   * Updates an existing lesson.
   * @param {number|string} id - The ID of the lesson to update.
   * @param {Object} data - Update payload.
   * @returns {Promise<boolean>} True if successful, otherwise false.
   */
  updateLesson: async (id, data) => {
    return await lessonModel.update(id, data);
  },

  /**
   * Retrieves all soft-deleted lessons.
   * @returns {Promise<Array>} Array of formatted deleted lessons.
   */
  getDeletedLessons: async () => {
    const lessons = await lessonModel.findDeleted();
    return lessons.map(lesson => formatLesson(lesson, true));
  },

  /**
   * Soft deletes a lesson.
   * @param {number|string} id - The ID of the lesson to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  deleteLesson: async (id) => {
    return await lessonModel.softDelete(id);
  },

  /**
   * Restores a soft-deleted lesson.
   * @param {number|string} id - The ID of the lesson to restore.
   * @returns {Promise<boolean>} True if successful.
   */
  restoreLesson: async (id) => {
    return await lessonModel.restore(id);
  },

  /**
   * Retrieves all lessons without pagination.
   * @returns {Promise<Array>} Array of all formatted lessons.
   */
  getAllLessons: async () => {
    const data = await lessonModel.findAll(); 
    return data.map(item => formatLesson(item));
  }
};
