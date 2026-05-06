'use strict';
const router = require('express').Router();
const userController = require('../../controllers/client/user.controller');
const uploadCloud = require('../../middlewares/upload.middleware');

router.get('/profile', userController.profile);
router.post('/profile/update', uploadCloud.single('avatar'), userController.updateProfile);
router.post('/profile/change-password', userController.changePassword);
router.get('/my-courses', userController.myCourses);
router.get('/certificate/:courseId', userController.viewCertificate);
router.get('/certificate/verify/:code', userController.verifyCertificate);
module.exports = router;
