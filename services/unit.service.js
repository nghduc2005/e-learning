import { unitModel } from "../models/unit.model.js";

/**
 * Format raw unit data into view-friendly format.
 * @param {Object} unit - The raw unit object from the database.
 * @returns {Object|null} Formatted unit object or null if input is falsy.
 */
const formatUnit = (unit) => {
  if (!unit) return null;
  const statusConfig = {
    "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
    "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
    "locked": { text: "Khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
  };
  return {
    id: unit.id,
    name: unit.name,
    status: statusConfig[unit.status] || statusConfig["hidden"],
    createdAt: new Date(unit.createdAt).toLocaleString('vi-VN'),
    deletedAt: unit.deletedAt ? new Date(unit.deletedAt).toLocaleString('vi-VN') : null,
    lessons: unit.lessonCount || 0
  };
};

export const unitService = {
  /**
   * Retrieves a paginated list of units with filtering and sorting.
   * @param {string} keyword - Search keyword.
   * @param {string} statusFilter - Filter by status (e.g., 'active', 'hidden').
   * @param {string} timeFilter - Filter by creation time.
   * @param {number} [page=1] - Current page number.
   * @param {number} [limit=5] - Number of items per page.
   * @returns {Promise<Object>} An object containing the formatted units array and pagination info.
   */
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
        units: units.map(formatUnit),
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

  /**
   * Retrieves a unit by its ID.
   * @param {number|string} id - The ID of the unit.
   * @returns {Promise<Object>} The raw unit object.
   */
  getUnitById: async (id) => {
    try {
      return await unitModel.findById(id);
    } catch (error) {
      console.error('Lỗi lấy thông tin chương:', error.message);
      throw error;
    }
  },

  /**
   * Creates a new unit.
   * @param {Object} data - Unit data payload.
   * @returns {Promise<number>} The ID of the newly created unit.
   */
  createUnit: async (data) => {
    try {
      return await unitModel.create(data);
    } catch (error) {
      console.error('Lỗi tạo chương mới:', error.message);
      throw error;
    }
  },

  /**
   * Updates an existing unit.
   * @param {number|string} id - The ID of the unit to update.
   * @param {Object} data - Update payload.
   * @returns {Promise<boolean>} True if successful, otherwise false.
   */
  updateUnit: async (id, data) => {
    try {
      return await unitModel.update(id, data);
    } catch (error) {
      console.error('Lỗi update thông tin chương:', error.message);
      throw error;
    }
  },

  /**
   * Soft deletes a unit by setting deletedAt.
   * @param {number|string} id - The ID of the unit to delete.
   * @returns {Promise<boolean>} True if successful.
   */
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

  /**
   * Retrieves all soft-deleted units.
   * @returns {Promise<Array>} Array of formatted deleted units.
   */
  getDeletedUnits: async () => {
    try {
      const result = await unitModel.findDeleted();
      return result.map(formatUnit);
    } catch (error) {
      console.error('Lỗi lấy chương đã xóa:', error.message);
      throw error;
    }
  },

  /**
   * Restores a soft-deleted unit.
   * @param {number|string} id - The ID of the unit to restore.
   * @returns {Promise<boolean>} True if successful.
   */
  restoreUnit: async (id) => {
    try {
      const isSuccess = await unitModel.restore(id);
      if (!isSuccess) throw new Error("Không thể khôi phục chương");
      return isSuccess;
    } catch (error) {
      console.error('Lỗi khôi phục chương:', error.message);
      throw error;
    }
  },

  /**
   * Retrieves all units without pagination.
   * @returns {Promise<Array>} Array of all formatted units.
   */
  getAllUnits: async () => {
    try {
      const data = await unitModel.findAll(); 
      return data.map(formatUnit);
    } catch (error) {
      console.error("Error in service: ", error);
      throw error;
    }
  }
};
