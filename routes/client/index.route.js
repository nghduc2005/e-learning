const router = require('express').Router();
const authRoute = require('./auth.route');
const { userAuth } = require('../../middlewares/userAuth.middleware');

// Gắn thông tin user (nếu có) vào res.locals cho mọi route client
router.use(userAuth);

router.use('/', authRoute);

router.get('/', (req, res) => {
  res.render('index');
});

module.exports = router;
