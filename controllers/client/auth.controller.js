'use strict';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../../models/user.model');
const refreshTokenModel = require('../../models/refreshToken.model');
const emailVerificationModel = require('../../models/emailVerification.model');
const { sendVerificationEmail } = require('../../services/email.service');

const hashPassword = (p) => crypto.createHash('sha256').update(p).digest('hex');

const ACCESS_COOKIE  = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;

const ACCESS_MAX_AGE  = 15 * 60 * 1000;           // 15 phút
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;  // 7 ngày
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;  // 24 giờ

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge
});

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
}

// userAuth middleware đã resolve user và gắn vào req.user trước khi vào controller
function isLoggedIn(req) {
  return !!(req.user);
}

async function issueTokenPair(res, user, req) {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username, avatar: user.avatar, status: user.status },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiredAt = new Date(Date.now() + REFRESH_MAX_AGE);

  await refreshTokenModel.create({
    userId: user.id,
    token: refreshToken,
    deviceInfo: req.headers['user-agent'] || null,
    ipAddress: req.ip || null,
    expiredAt
  });

  res.cookie(ACCESS_COOKIE,  accessToken,  cookieOpts(ACCESS_MAX_AGE));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(REFRESH_MAX_AGE));
}

// ─── Helper tạo & gửi token xác thực ─────────────────────────────────────────

async function createAndSendVerification(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiredAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await emailVerificationModel.create({ userId: user.id, token, expiredAt });
  await sendVerificationEmail(user.email, user.username, token);
}

// ─── Pages ───────────────────────────────────────────────────────────────────

const authController = {
  // GET /register
  registerPage: (req, res) => {
    if (isLoggedIn(req)) return res.redirect('/');
    res.render('client/auth/register', { layout: false, error: null, success: null, formData: {} });
  },

  // POST /register
  registerPost: async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    const trimmedUsername = (username || '').trim();
    const trimmedEmail    = (email    || '').trim().toLowerCase();

    const fail = (error) => res.render('client/auth/register', {
      layout: false, success: null, error,
      formData: { username: trimmedUsername, email: trimmedEmail }
    });

    // ── Validate ──
    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword)
      return fail('Vui lòng điền đầy đủ thông tin.');
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50)
      return fail('Tên đăng nhập phải từ 3 đến 50 ký tự.');
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername))
      return fail('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      return fail('Địa chỉ email không hợp lệ.');
    if (password.length < 6)
      return fail('Mật khẩu phải có ít nhất 6 ký tự.');
    if (password !== confirmPassword)
      return fail('Mật khẩu xác nhận không khớp.');

    try {
      // ── Kiểm tra trùng username & email ──
      const [existingUser, existingEmail] = await Promise.all([
        userModel.findByUsername(trimmedUsername),
        userModel.findByEmail(trimmedEmail),
      ]);
      if (existingUser)  return fail('Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác.');
      if (existingEmail) return fail('Địa chỉ email này đã được đăng ký.');

      // ── Tạo user (status = unverified) ──
      const userId = await userModel.create({
        username: trimmedUsername,
        email:    trimmedEmail,
        password: hashPassword(password),
      });

      const newUser = { id: userId, username: trimmedUsername, email: trimmedEmail };

      // ── Gửi email xác thực ──
      await createAndSendVerification(newUser);

      res.redirect(`/verify-email-sent?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      fail('Đã xảy ra lỗi hệ thống, vui lòng thử lại.');
    }
  },

  // GET /verify-email-sent  (thông báo "kiểm tra hộp thư")
  verifyEmailSentPage: (req, res) => {
    const email = req.query.email || '';
    res.render('client/auth/verify-email-sent', { layout: false, email });
  },

  // GET /verify-email?token=...
  verifyEmail: async (req, res) => {
    const { token } = req.query;

    const renderResult = (success, message) =>
      res.render('client/auth/verify-email-result', { layout: false, success, message });

    if (!token) return renderResult(false, 'Liên kết xác thực không hợp lệ.');

    try {
      const record = await emailVerificationModel.findValidByToken(token);
      if (!record) return renderResult(false, 'Liên kết xác thực đã hết hạn hoặc không hợp lệ.');

      // Kích hoạt user & đánh dấu token đã dùng
      await Promise.all([
        userModel.activate(record.userId),
        emailVerificationModel.markUsed(record.id),
      ]);

      renderResult(true, 'Email của bạn đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
    } catch (err) {
      console.error('Lỗi xác thực email:', err);
      renderResult(false, 'Đã xảy ra lỗi hệ thống, vui lòng thử lại.');
    }
  },

  // GET /login
  loginPage: (req, res) => {
    if (isLoggedIn(req)) return res.redirect('/');
    const success = req.query.verified === '1'
      ? 'Email đã xác thực! Bạn có thể đăng nhập.'
      : null;
    res.render('client/auth/login', { layout: false, error: null, success, formData: {} });
  },

  // POST /login
  loginPost: async (req, res) => {
    const { username, password } = req.body;
    const trimmedUsername = (username || '').trim();

    const fail = (error) => res.render('client/auth/login', {
      layout: false, success: null, error,
      formData: { username: trimmedUsername }
    });

    if (!trimmedUsername || !password)
      return fail('Vui lòng điền đầy đủ thông tin.');

    try {
      const user = await userModel.findByUsername(trimmedUsername);

      if (!user || user.password !== hashPassword(password))
        return fail('Tên đăng nhập hoặc mật khẩu không chính xác.');

      if (user.status === 'banned')
        return fail('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');

      if (user.status === 'unverified')
        return fail('Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư của bạn.');

      await issueTokenPair(res, user, req);
      res.redirect('/');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      fail('Đã xảy ra lỗi hệ thống, vui lòng thử lại.');
    }
  },

  // POST /logout
  logout: async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE];
    if (refreshToken) {
      try { await refreshTokenModel.revoke(refreshToken); } catch {}
    }
    clearAuthCookies(res);
    res.redirect('/login');
  }
};

module.exports = authController;
