const { courseController } = require('../../controllers/admin/course.controller')

const router = require('express').Router()

router.get("/course-list", courseController.courseList)

module.exports = router