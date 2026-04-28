import curriculumModel from "../models/curriculum.model.js";

const curriculumService = {
  getCurriculumByCourseId: async (courseId) => {
    try {
      return await curriculumModel.getCurriculumByCourseId(courseId);
    } catch (error) {
      console.error('Lỗi khi lấy chương trình học:', error.message);
      throw error;
    }
  },
  saveCurriculum: async (courseId, curriculumData) => {
    try {
        const isSuccess = await curriculumModel.saveCurriculum(courseId, curriculumData);
        if (!isSuccess) throw new Error("Không thể lưu chương trình học");
        return isSuccess;
    } catch (error) {
        console.error('Lỗi khi lưu chương trình học:', error.message);
        throw error;
    }
  }
}

export default curriculumService;