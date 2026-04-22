const { courseController } = require('../../controllers/admin/course.controller')
const upload = require('../../middlewares/upload.middleware')

const router = require('express').Router()

router.get("/list", courseController.list)
router.get("/create", courseController.create)
router.get("/curriculum", courseController.curriculum)
router.post("/create", upload.single("banner"), courseController.createPost)

module.exports = router