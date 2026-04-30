// Danh sách URL được coi là "trang danh sách" → không hiển thị nút quay lại
const LIST_PAGES = [
  '/dashboard',
  '/course/list',
  '/unit/list',
  '/lesson/list',
  '/trash',
];

const BACK_URL_MAP = {
  course:  '/admin/course/list',
  unit:    '/admin/unit/list',
  lesson:  '/admin/lesson/list',
};

module.exports = function backButtonMiddleware(req, res, next) {
  const path = req.path;

  // Không hiển thị nút quay lại ở các trang danh sách / dashboard
  if (LIST_PAGES.includes(path)) {
    res.locals.backUrl = null;
    return next();
  }

  // Xác định section (course / unit / lesson) từ segment đầu tiên
  const section = path.replace(/^\//, '').split('/')[0];
  res.locals.backUrl = BACK_URL_MAP[section] || null;

  next();
};
