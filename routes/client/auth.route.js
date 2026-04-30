const router = require('express').Router();
const authController = require('../../controllers/client/auth.controller');

router.get('/register', authController.registerPage);
router.post('/register', authController.registerPost);

router.get('/verify-email-sent', authController.verifyEmailSentPage);
router.get('/verify-email', authController.verifyEmail);

router.get('/login', authController.loginPage);
router.post('/login', authController.loginPost);

router.post('/logout', authController.logout);

module.exports = router;
