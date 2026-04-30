const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const adminModel = require('../../models/admin.model');
const logAction = require('../../utils/auditLogger');

const hashPassword = (p) => crypto.createHash('sha256').update(p).digest('hex');

const SETTINGS_PATH = path.join(__dirname, '../../config/settings.json');

const readSettings = () => {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return { siteName: 'E-Learning Platform', siteDescription: '', contactEmail: '', maintenanceMode: false };
  }
};

const writeSettings = (data) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const profileController = {
  // GET /admin/profile
  profilePage: async (req, res) => {
    try {
      const admin = await adminModel.findById(req.session.admin.id);
      res.render('admin/profile', {
        title: 'Thông tin cá nhân',
        admin
      });
    } catch (err) {
      console.error('Lỗi tải profile:', err);
      res.status(500).send('Lỗi server');
    }
  },

  // POST /admin/profile/email
  updateEmail: async (req, res) => {
    const { email, currentPassword } = req.body;
    const adminId = req.session.admin.id;

    if (!email || !currentPassword) {
      req.session.flash = { type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' };
      return res.redirect('/admin/profile');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.session.flash = { type: 'error', message: 'Địa chỉ email không hợp lệ.' };
      return res.redirect('/admin/profile');
    }

    try {
      const admin = await adminModel.findByUsername(req.session.admin.username);

      if (admin.password !== hashPassword(currentPassword)) {
        req.session.flash = { type: 'error', message: 'Mật khẩu hiện tại không chính xác.' };
        return res.redirect('/admin/profile');
      }

      const existing = await adminModel.findByEmail(email, adminId);
      if (existing) {
        req.session.flash = { type: 'error', message: 'Email này đã được sử dụng bởi tài khoản khác.' };
        return res.redirect('/admin/profile');
      }

      await adminModel.updateEmail(adminId, email);
      req.session.admin.email = email;
      await logAction(adminId, 'update_email', 'Cập nhật địa chỉ email');
      req.session.flash = { type: 'success', message: 'Cập nhật email thành công!' };
      res.redirect('/admin/profile');
    } catch (err) {
      console.error('Lỗi cập nhật email:', err);
      req.session.flash = { type: 'error', message: 'Đã xảy ra lỗi, vui lòng thử lại.' };
      res.redirect('/admin/profile');
    }
  },

  // POST /admin/profile/password
  updatePassword: async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.session.admin.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.flash = { type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' };
      return res.redirect('/admin/profile');
    }

    if (newPassword.length < 6) {
      req.session.flash = { type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
      return res.redirect('/admin/profile');
    }

    if (newPassword !== confirmPassword) {
      req.session.flash = { type: 'error', message: 'Mật khẩu xác nhận không khớp.' };
      return res.redirect('/admin/profile');
    }

    try {
      const admin = await adminModel.findByUsername(req.session.admin.username);

      if (admin.password !== hashPassword(currentPassword)) {
        req.session.flash = { type: 'error', message: 'Mật khẩu hiện tại không chính xác.' };
        return res.redirect('/admin/profile');
      }

      if (currentPassword === newPassword) {
        req.session.flash = { type: 'error', message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' };
        return res.redirect('/admin/profile');
      }

      await adminModel.updatePassword(adminId, hashPassword(newPassword));
      await logAction(adminId, 'update_password', 'Đổi mật khẩu tài khoản');
      req.session.flash = { type: 'success', message: 'Đổi mật khẩu thành công!' };
      res.redirect('/admin/profile');
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      req.session.flash = { type: 'error', message: 'Đã xảy ra lỗi, vui lòng thử lại.' };
      res.redirect('/admin/profile');
    }
  },

  // GET /admin/settings
  settingsPage: async (req, res) => {
    try {
      const settings = readSettings();
      const adminCount = await adminModel.countAll();
      res.render('admin/settings', {
        title: 'Cài đặt hệ thống',
        settings,
        adminCount
      });
    } catch (err) {
      console.error('Lỗi tải settings:', err);
      res.status(500).send('Lỗi server');
    }
  },

  // POST /admin/settings
  updateSettings: (req, res) => {
    const { siteName, siteDescription, contactEmail, maintenanceMode } = req.body;
    const adminId = req.session.admin?.id;

    if (!siteName || !siteName.trim()) {
      req.session.flash = { type: 'error', message: 'Tên nền tảng không được để trống.' };
      return res.redirect('/admin/settings');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactEmail && !emailRegex.test(contactEmail)) {
      req.session.flash = { type: 'error', message: 'Địa chỉ email liên hệ không hợp lệ.' };
      return res.redirect('/admin/settings');
    }

    try {
      writeSettings({
        siteName: siteName.trim(),
        siteDescription: (siteDescription || '').trim(),
        contactEmail: (contactEmail || '').trim(),
        maintenanceMode: maintenanceMode === 'on'
      });
      logAction(adminId, 'update_settings', `Cập nhật cài đặt hệ thống: ${siteName.trim()}`).catch(console.error);
      req.session.flash = { type: 'success', message: 'Lưu cài đặt thành công!' };
      res.redirect('/admin/settings');
    } catch (err) {
      console.error('Lỗi lưu settings:', err);
      req.session.flash = { type: 'error', message: 'Đã xảy ra lỗi khi lưu cài đặt.' };
      res.redirect('/admin/settings');
    }
  }
};

module.exports = profileController;
