
import { courseDto } from "../dtos/course.dto.js";
import { courseModel } from "../models/course.model.js";

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
        return course;
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
  }
};
