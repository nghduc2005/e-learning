import { unitService } from "../../services/unit.service.js";
import logAction from "../../utils/auditLogger.js";

const unitController = {
  list: async (req, res) => {
    const keyword = req.query.q || ''
    const status = req.query.status || ''
    const time = req.query.time || ''
    const students = req.query.students || ''

    let page = req.query.page ? parseInt(req.query.page) : 1;
    if (isNaN(page) || page < 1) page = 1;

    const limit = 5;

    const result = await unitService.getUnitList(keyword, status, time, page, limit);

    let finalPage = page;
    if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
      finalPage = result.pagination.totalPages;
    }

    if (req.query.page !== undefined && String(req.query.page) !== String(finalPage)) {
      const queryParams = new URLSearchParams(req.query);
      queryParams.set('page', finalPage);
      const basePath = req.originalUrl.split('?')[0];
      return res.redirect(`${basePath}?${queryParams.toString()}`);
    }

    res.render("admin/unitList", {
      title: "Danh sách chương",
      unitList: result.units,
      pagination: result.pagination,
      query: req.query
    })
  },

  detail: async (req, res) => {
    try {
      const id = req.params.id;
      const unit = await unitService.getUnitById(id);

      if (!unit) {
        return res.redirect("/admin/unit/list");
      }

      res.render("admin/unitDetail", {
        title: "Chi tiết chương",
        unit: unit
      });
    } catch (error) {
      console.error("Lỗi trang Detail Unit:", error);
      res.redirect("/admin/unit/list");
    }
  },

  create: (req, res) => {
    res.render("admin/unitCreate", {
      title: "Tạo chương"
    })
  },

  createPost: async (req, res) => {
    try {
      const data = {
        title: req.body.title,
        status: req.body.status
      };

      await unitService.createUnit(data);

      await logAction(req.session.admin?.id, 'create_unit', `Tạo chương: ${req.body.title}`);

      res.json({
        data: {
          ok: 1,
          message: "Tạo chương thành công!"
        }
      });
    } catch (error) {
      console.error("Lỗi khi tạo chương:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình tạo chương!" });
    }
  },

  edit: async (req, res) => {
    try {
      const id = req.params.id;
      const unit = await unitService.getUnitById(id);

      if (!unit) {
        return res.redirect("/admin/unit/list");
      }

      res.render("admin/unitEdit", {
        title: "Chỉnh sửa chương",
        unit: unit
      });
    } catch (error) {
      console.error("Lỗi trang Edit Unit:", error);
      res.redirect("/admin/unit/list");
    }
  },

  editPost: async (req, res) => {
    try {
      const id = req.params.id;
      const data = {
        title: req.body.title,
        status: req.body.status
      };

      await unitService.updateUnit(id, data);

      await logAction(req.session.admin?.id, 'update_unit', `Cập nhật chương: ${req.body.title}`);

      res.json({
        data: {
          ok: 1,
          message: "Cập nhật chương thành công!"
        }
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật chương:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình cập nhật!" });
    }
  },

  delete: async (req, res) => {
    try {
      const id = req.params.id;
      await unitService.deleteUnit(id);

      await logAction(req.session.admin?.id, 'delete_unit', `Xóa chương #${id}`);

      const backURL = req.header('Referer') || '/admin/unit/list';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi xóa chương:", error);
      res.redirect("/admin/unit/list");
    }
  },

  restore: async (req, res) => {
    try {
      const id = req.params.id;
      await unitService.restoreUnit(id);

      await logAction(req.session.admin?.id, 'restore_unit', `Khôi phục chương #${id}`);

      const backURL = req.header('Referer') || '/admin/trash';
      res.redirect(backURL);
    } catch (error) {
      console.error("Lỗi khi khôi phục chương:", error);
      res.redirect("/admin/trash");
    }
  }
}

export default unitController
