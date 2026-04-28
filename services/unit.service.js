import { unitModel } from "../models/unit.model.js";
import unitDto from "../dtos/unit.dto.js";

export const unitService = {
  getUnitList: async (keyword, statusFilter, timeFilter, page = 1, limit = 5) => {
    try {
      const offset = (page - 1) * limit;

      let sortCondition = '';
      if (timeFilter === 'this_month') sortCondition = 'u.createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      else if (timeFilter === '3_months') sortCondition = 'u.createdAt >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
      else if (timeFilter === 'this_year') sortCondition = 'u.createdAt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';

      const totalItems = await unitModel.countAll(keyword, statusFilter);
      const units = await unitModel.findAll(keyword, statusFilter, sortCondition, limit, offset);

      return {
        units: unitDto.unitListView(units),
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          page,
          limit
        }
      };
    } catch (error) {
      console.error('Lỗi ở UnitService:', error.message);
      throw error;
    }
  },

  getUnitById: async (id) => {
    try {
      const unit = await unitModel.findById(id);
      return unit; // Trả về raw data cho trang Edit
    } catch (error) {
      console.error('Lỗi lấy thông tin chương:', error.message);
      throw error;
    }
  },

  createUnit: async (data) => {
    try {
        const insertId = await unitModel.create(data);
        return insertId;
    } catch (error) {
        console.error('Lỗi tạo chương mới:', error.message);
        throw error;
    }
  },

  updateUnit: async (id, data) => {
    try {
        const isSuccess = await unitModel.update(id, data);
        return isSuccess;
    } catch (error) {
        console.error('Lỗi update thông tin chương:', error.message);
        throw error;
    }
  },

  deleteUnit: async (id) => {
    try {
        const isSuccess = await unitModel.softDelete(id);
        if (!isSuccess) throw new Error("Không thể xóa chương");
        return isSuccess;
    } catch (error) {
        console.error('Lỗi xóa chương:', error.message);
        throw error;
    }
  },

  getDeletedUnits: async () => {
    try {
        const result = await unitModel.findDeleted();
        return unitDto.unitListView(result);
    } catch (error) {
        console.error('Lỗi lấy chương đã xóa:', error.message);
        throw error;
    }
  },

  restoreUnit: async (id) => {
    try {
        const isSuccess = await unitModel.restore(id);
        if (!isSuccess) throw new Error("Không thể khôi phục chương");
        return isSuccess;
    } catch (error) {
        console.error('Lỗi khôi phục chương:', error.message);
        throw error;
    }
  }
};
