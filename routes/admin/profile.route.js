const router = require('express').Router();
const profileController = require('../../controllers/admin/profile.controller');

router.get('/', profileController.profilePage);
router.post('/email', profileController.updateEmail);
router.post('/password', profileController.updatePassword);

module.exports = router;
