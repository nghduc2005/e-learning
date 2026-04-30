const jwt = require('jsonwebtoken');
const refreshTokenModel = require('../models/refreshToken.model');
const userModel = require('../models/user.model');

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

const accessCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000
};

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
}

async function resolveUser(req, res) {
  const accessToken = req.cookies[ACCESS_COOKIE];

  // 1. Verify access token
  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, ACCESS_SECRET);
      // Nếu status trong payload không hợp lệ → clear và bỏ qua
      if (payload.status === 'banned' || payload.status === 'unverified') {
        clearAuthCookies(res);
        return null;
      }
      return { id: payload.userId, username: payload.username, avatar: payload.avatar, status: payload.status };
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        clearAuthCookies(res);
        return null;
      }
      // Token expired → fall through to refresh
    }
  }

  // 2. Try refresh token
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (!refreshToken) return null;

  try {
    const stored = await refreshTokenModel.findByToken(refreshToken);
    if (!stored) { clearAuthCookies(res); return null; }

    const user = await userModel.findById(stored.userId);
    if (!user || user.status === 'banned' || user.status === 'unverified') { clearAuthCookies(res); return null; }

    // Issue new access token
    const newAccess = jwt.sign(
      { userId: user.id, username: user.username, avatar: user.avatar, status: user.status },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    res.cookie(ACCESS_COOKIE, newAccess, accessCookieOpts);

    return { id: user.id, username: user.username, avatar: user.avatar, status: user.status };
  } catch {
    clearAuthCookies(res);
    return null;
  }
}

// Đính kèm user vào req nếu có token hợp lệ, không redirect (dùng cho route public)
async function userAuth(req, res, next) {
  const user = await resolveUser(req, res);
  req.user = user;
  res.locals.user = user;
  next();
}

// Yêu cầu đăng nhập, redirect /login nếu chưa xác thực (dùng cho route protected)
async function requireUser(req, res, next) {
  const user = await resolveUser(req, res);
  if (!user) return res.redirect('/login');
  req.user = user;
  res.locals.user = user;
  next();
}

module.exports = { userAuth, requireUser };
