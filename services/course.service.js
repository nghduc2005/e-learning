
import { courseDto } from "../dtos/course.dto.js";
import lessonDto from "../dtos/lesson.dto.js";
import unitDto from "../dtos/unit.dto.js";
import { courseModel } from "../models/course.model.js";
import { lessonModel } from "../models/lesson.model.js";
import { unitModel } from "../models/unit.model.js";

export const courseService = {
  getCourseList: async (keyword = '', status = '', time = '', students = '', page = 1, limit = 10) => {
    try {
        const result = await courseModel.findAll(keyword, status, time, students, page, limit);
        return {
            courses: courseDto.courseListView(result.data),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                totalItems: result.totalItems,
                totalPages: Math.ceil(result.totalItems / limit)
            }
        };
    } catch (error) {
        console.error('Lỗi logic lấy danh sách khóa học:', error.message);
        throw error;
    }
  },

  getCourseById: async (id) => {
    try {
        const course = await courseModel.findById(id);
        if (!course) return null;
        return courseDto.courseView(course);
    } catch (error) {
        console.error('Lỗi lấy thông tin khóa học:', error.message);
        throw error;
    }
  },

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

        const isSuccess = await courseModel.update(id, data);
        return isSuccess;
    } catch (error) {
        console.error('Lỗi update thông tin khóa học:', error.message);
        throw error;
    }
  },

  createCourse: async (data) => {
    try {
        const insertId = await courseModel.create(data);
        return insertId;
    } catch (error) {
        console.error('Lỗi tạo khóa học mới:', error.message);
        throw error;
    }
  },

  getDeletedCourses: async () => {
    try {
        const result = await courseModel.findDeleted();
        return courseDto.courseListView(result);
    } catch (error) {
        console.error('Lỗi lấy khóa học đã xóa:', error.message);
        throw error;
    }
  },

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

  getAllUnits: async () => {
    try {
      const data = await unitModel.findAll(); 
      return data.map(item => unitDto.unitView(item));
    } catch (error) {
      console.error("Error in service: ", error);
      throw error;
    }
  },

  getAllLessons: async () => {
    try {
      const data = await lessonModel.findAll(); 
      return data.map(item => lessonDto.lessonView(item));
    } catch (error) {
      console.error("Error in service: ", error);
      throw error;
    }
  },

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
  getEnrollUser: async (userId, courseId) => {
    try {
      const result = await courseModel.findUserCourse(userId, courseId);
      return result;
    } catch (error) {
      console.error("Error in service: ", error);
      throw error;
    }
  },
  getFirstUncompletedLessonId: async (userId, courseId) => {
    try {
      const result = await courseModel.findFirstUncompletedLesson(userId, courseId);
      const defaultLeson = await lessonModel.findFirstByCourseId(courseId);
      return result ? result.lessonId : (defaultLeson ? defaultLeson.id : null);
    } catch (error) {
      console.error("Error in service: ", error);
      throw error;
    }
  }
};
