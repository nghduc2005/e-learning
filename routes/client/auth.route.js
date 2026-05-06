const router = require('express').Router();
const authController = require('../../controllers/client/auth.controller');

router.get('/register', authController.registerPage);
router.post('/register', authController.registerPost);

router.get('/verify-email-sent', authController.verifyEmailSentPage);
router.get('/verify-email', authController.verifyEmail);

router.get('/login', authController.loginPage);
router.post('/login', authController.loginPost);

router.post('/logout', authController.logout);

router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.forgotPasswordPost);
router.get('/reset-password', authController.resetPasswordPage);
router.post('/reset-password', authController.resetPasswordPost);

module.exports = router;
