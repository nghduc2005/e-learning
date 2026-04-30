const crypto = require('crypto');
const adminModel = require('../../models/admin.model');
const logAction = require('../../utils/auditLogger');

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password).digest('hex');

const authController = {
  loginPage: (req, res) => {
    if (req.session && req.session.admin) {
      return res.redirect('/admin/dashboard');
    }
    res.render('admin/auth/login', { layout: false, error: null, success: null });
  },

  loginPost: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('admin/auth/login', {
        layout: false,
        error: 'Vui lòng điền đầy đủ thông tin đăng nhập.',
        success: null,
        formData: { username }
      });
    }

    try {
      const admin = await adminModel.findByUsername(username.trim());

      if (!admin) {
        return res.render('admin/auth/login', {
          layout: false,
          error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
          success: null,
          formData: { username }
        });
      }

      if (admin.status === 'banned') {
        return res.render('admin/auth/login', {
          layout: false,
          error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hệ thống.',
          success: null,
          formData: { username }
        });
      }

      if (admin.password !== hashPassword(password)) {
        return res.render('admin/auth/login', {
          layout: false,
          error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
          success: null,
          formData: { username }
        });
      }

      req.session.admin = {
        id: admin.id,
        username: admin.username,
        email: admin.email
      };

      await logAction(admin.id, 'admin_login', `Đăng nhập thành công: ${admin.username}`);
      res.redirect('/admin/dashboard');
    } catch (error) {
      console.error('Lỗi đăng nhập admin:', error);
      res.render('admin/auth/login', {
        layout: false,
        error: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.',
        success: null,
        formData: { username }
      });
    }
  },

  logout: (req, res) => {
    const adminId = req.session.admin?.id;
    const username = req.session.admin?.username;
    req.session.destroy(() => {
      logAction(adminId, 'admin_logout', `Đăng xuất: ${username}`).catch(console.error);
      res.redirect('/admin/auth/login');
    });
  }
};

module.exports = authController;
