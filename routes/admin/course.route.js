const { courseController } = require('../../controllers/admin/course.controller')

const router = require('express').Router()

router.get("/course-list", courseController.list)
router.get("/course-create", courseController.create)
router.get("/curriculum", courseController.curriculum)
router.post("/course-create", courseController.createPost)

module.exports = router