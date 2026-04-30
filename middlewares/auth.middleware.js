module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    res.locals.currentAdmin = req.session.admin;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    return next();
  }
  res.redirect('/admin/auth/login');
};
