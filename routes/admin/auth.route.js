const router = require('express').Router();
const authController = require('../../controllers/admin/auth.controller');

router.get('/login', authController.loginPage);
router.post('/login', authController.loginPost);
router.post('/logout', authController.logout);

module.exports = router;
