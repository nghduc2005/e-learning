const lessonController = require('../../controllers/admin/lesson.controller')

const router = require('express').Router()

router.get("/list", lessonController.list)
router.get("/create", lessonController.create)

module.exports = router