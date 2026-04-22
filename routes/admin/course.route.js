const { courseController } = require('../../controllers/admin/course.controller')

const router = require('express').Router()

router.get("/list", courseController.list)
router.get("/create", courseController.create)
router.get("/curriculum", courseController.curriculum)
router.post("/create", courseController.createPost)

module.exports = router