import { courseModel } from "../models/course.model.js";
import { lessonModel } from "../models/lesson.model.js";
import { unitModel } from "../models/unit.model.js";

const BANNER_GRADIENTS = [
  ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
  ['#ffecd2', '#fcb69f'], ['#96fbc4', '#f9f586'], ['#89f7fe', '#66a6ff'],
  ['#fddb92', '#d1fdff'],
];

const generateBannerSvg = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const [c1, c2] = BANNER_GRADIENTS[Math.abs(hash) % BANNER_GRADIENTS.length];

  const words = name.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 24 && line) { lines.push(line); line = w; }
    else { line = (line + ' ' + w).trim(); }
    if (lines.length === 1) { lines.push(line); break; }
  }
  if (lines.length === 0) lines.push(line);

  const textEls = lines.map((l, i) =>
    `<text x="400" y="${lines.length === 1 ? 140 : 120 + i * 50}" font-family="'Segoe UI',Arial,sans-serif" font-size="36" font-weight="700" fill="white" text-anchor="middle" opacity="0.95">${l}</text>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="280" viewBox="0 0 800 280">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1};stop-opacity:1"/><stop offset="100%" style="stop-color:${c2};stop-opacity:1"/></linearGradient></defs>
    <rect width="800" height="280" fill="url(#bg)" rx="0"/>
    <circle cx="650" cy="50" r="120" fill="white" opacity="0.06"/>
    <circle cx="100" cy="230" r="90" fill="white" opacity="0.06"/>
    <rect x="0" y="0" width="800" height="280" fill="rgba(0,0,0,0.10)" rx="0"/>
    ${textEls}
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
};

/**
 * Format raw course data into view-friendly format.
 * @param {Object} course - The raw course object from the database.
 * @returns {Object|null} Formatted course object or null if input is falsy.
 */
const formatCourse = (course) => {
  if (!course) return null;
  const statusConfig = {
    "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
    "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
    "locked": { text: "Đã khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
  };
  return {
    id: course.id,
    name: course.name,
    banner: course.banner || generateBannerSvg(course.name),
    status: statusConfig[course.status] || statusConfig["hidden"],
    description: course.description || '',
    createdAt: new Date(course.createdAt).toLocaleString('vi-VN'),
    updatedAt: course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : null,
    deletedAt: course.deletedAt ? new Date(course.deletedAt).toLocaleString('vi-VN') : null,
    students: course.studentCount || 0
  };
};

export const courseService = {
  /**
   * Retrieves a paginated list of courses with filtering.
   * @param {string} [keyword=''] - Search keyword.
   * @param {string} [status=''] - Filter by status.
   * @param {string} [time=''] - Filter by creation time.
   * @param {string|number} [students=''] - Filter by student count.
   * @param {number} [page=1] - Current page number.
   * @param {number} [limit=10] - Number of items per page.
   * @returns {Promise<Object>} An object containing the formatted courses array and pagination info.
   */
  getCourseList: async (keyword = '', status = '', time = '', students = '', page = 1, limit = 10) => {
    try {
      const result = await courseModel.findAll(keyword, status, time, students, page, limit);
      return {
        courses: result.data.map(formatCourse),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalItems: result.totalItems,
          totalPages: Math.ceil(result.totalItems / limit)
        }
      };
    } catch (error) {
      console.error('Lỗi lấy danh sách khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves formatted course details by its ID.
   * @param {number|string} id - The ID of the course.
   * @returns {Promise<Object|null>} Formatted course object or null if not found.
   */
  getCourseById: async (id) => {
    try {
      const course = await courseModel.findById(id);
      return formatCourse(course);
    } catch (error) {
      console.error('Lỗi lấy thông tin khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves raw course details by its ID (unformatted).
   * @param {number|string} id - The ID of the course.
   * @returns {Promise<Object|null>} Raw course object or null if not found.
   */
  getRawCourseById: async (id) => {
    try {
      return await courseModel.findById(id);
    } catch (error) {
      console.error('Lỗi lấy thông tin raw khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Updates an existing course and handles banner replacement/deletion.
   * @param {number|string} id - The ID of the course to update.
   * @param {Object} data - Update payload.
   * @param {boolean} deleteBannerFlag - Flag indicating if the banner should be deleted.
   * @returns {Promise<boolean>} True if successful.
   */
  updateCourse: async (id, data, deleteBannerFlag) => {
    try {
      const oldCourse = await courseModel.findById(id);
      if (!oldCourse) throw new Error("Khóa học không tồn tại");
      const cloudinary = (await import("../config/cloudinary.js")).default;
      if ((deleteBannerFlag || data.banner) && oldCourse.banner) {
        try {
          const urlParts = oldCourse.banner.split('/');
          const fileWithExt = urlParts.pop(); 
          const folderType = urlParts.pop(); 
          const folderMain = urlParts.pop(); 
          const fileName = fileWithExt.split('.')[0]; 
          const publicId = `${folderMain}/${folderType}/${fileName}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Lỗi dọn rác Cloudinary:", err);
        }
      }
      if (deleteBannerFlag && !data.banner) {
        data.banner = null;
      }
      return await courseModel.update(id, data);
    } catch (error) {
      console.error('Lỗi update thông tin khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Creates a new course.
   * @param {Object} data - Course data payload.
   * @returns {Promise<number>} The ID of the newly created course.
   */
  createCourse: async (data) => {
    try {
      return await courseModel.create(data);
    } catch (error) {
      console.error('Lỗi tạo khóa học mới:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves all soft-deleted courses.
   * @returns {Promise<Array>} Array of formatted deleted courses.
   */
  getDeletedCourses: async () => {
    try {
      const result = await courseModel.findDeleted();
      return result.map(formatCourse);
    } catch (error) {
      console.error('Lỗi lấy khóa học đã xóa:', error.message);
      throw error;
    }
  },

  /**
   * Soft deletes a course.
   * @param {number|string} id - The ID of the course to delete.
   * @returns {Promise<boolean>} True if successful.
   */
  deleteCourse: async (id) => {
    try {
      const isSuccess = await courseModel.softDelete(id);
      if (!isSuccess) throw new Error("Không thể xóa khóa học");
      return isSuccess;
    } catch (error) {
      console.error('Lỗi xóa khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Restores a soft-deleted course.
   * @param {number|string} id - The ID of the course to restore.
   * @returns {Promise<boolean>} True if successful.
   */
  restoreCourse: async (id) => {
    try {
      const isSuccess = await courseModel.restore(id);
      if (!isSuccess) throw new Error("Không thể khôi phục khóa học");
      return isSuccess;
    } catch (error) {
      console.error('Lỗi khôi phục khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves all public active courses.
   * @returns {Promise<Array>} Array of public course objects.
   */
  getPublicCourses: async () => {
    try {
      const rows = await courseModel.findPublic();
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        banner: row.banner,
        status: row.status,
        studentCount: row.studentCount || 0,
        avgRating: row.avgRating ? Number(row.avgRating) : null,
        reviewCount: row.reviewCount || 0,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Lỗi lấy danh sách khóa học công khai:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves comprehensive details of a course including its units and lessons.
   * @param {number|string} id - The ID of the course.
   * @returns {Promise<Object|null>} Detailed course tree or null if not found.
   */
  getCourseDetail: async (id) => {
    try {
      const course = await courseModel.findCourseDetail(id);
      if (!course) return null;
      return {
        id: course.id,
        name: course.name,
        description: course.description,
        shortDescription: course.description
          ? course.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 200)
          : '',
        banner: course.banner,
        status: course.status,
        studentCount: course.studentCount || 0,
        avgRating: course.avgRating ? Number(course.avgRating) : null,
        reviewCount: course.reviewCount || 0,
        createdAt: course.createdAt,
        units: (course.units || []).map(u => ({
          id: u.id,
          name: u.name,
          status: u.status,
          lessons: (u.lessons || []).map(l => ({
            id: l.id,
            name: l.name,
            learnMode: l.learnMode,
            status: l.status,
            passScore: l.passScore,
          })),
        })),
      };
    } catch (error) {
      console.error('Lỗi lấy chi tiết khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Enrolls a user in a course if they are not already enrolled.
   * @param {number|string} userId - The ID of the user.
   * @param {number|string} courseId - The ID of the course.
   * @returns {Promise<void>}
   */
  enrollUserToCourse: async (userId, courseId) => {
    try {
      const existing = await courseModel.findUserCourse(userId, courseId);
      if (existing) {
        throw new Error('Bạn đã tham gia khóa học này rồi');
      }
      await courseModel.enrollUser(userId, courseId);
    } catch (error) {
      console.error('Lỗi tham gia khóa học:', error.message);
      throw error;
    }
  },

  /**
   * Checks if a user is enrolled in a specific course.
   * @param {number|string} userId - The ID of the user.
   * @param {number|string} courseId - The ID of the course.
   * @returns {Promise<Object|null>} The enrollment record if it exists, otherwise null.
   */
  getEnrollUser: async (userId, courseId) => {
    try {
      return await courseModel.findUserCourse(userId, courseId);
    } catch (error) {
      console.error('Error fetching enrollment:', error.message);
      throw error;
    }
  },

  /**
   * Finds the ID of the first uncompleted lesson for a user in a course.
   * Falls back to the first lesson in the course if all are completed or none started.
   * @param {number|string} userId - The ID of the user.
   * @param {number|string} courseId - The ID of the course.
   * @returns {Promise<number|null>} The ID of the target lesson or null.
   */
  getFirstUncompletedLessonId: async (userId, courseId) => {
    try {
      const result = await courseModel.findFirstUncompletedLesson(userId, courseId);
      const defaultLesson = await lessonModel.findFirstByCourseId(courseId);
      return result ? result.lessonId : (defaultLesson ? defaultLesson.id : null);
    } catch (error) {
      console.error('Error fetching first uncompleted lesson:', error.message);
      throw error;
    }
  }
};
