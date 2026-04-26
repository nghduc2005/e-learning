const { courseController } = require('../../controllers/admin/course.controller')
const uploadCloud = require('../../middlewares/upload.middleware')
const { courseSchema, validate } = require('../../middlewares/validate.middleware')

const router = require('express').Router()

router.get("/list", courseController.list)
router.get("/create", courseController.create)
router.get("/edit/:id", courseController.edit)
router.post("/edit/:id", uploadCloud.single("banner"), validate(courseSchema), courseController.editPost)
router.post("/delete/:id", courseController.delete)
router.get("/curriculum", courseController.curriculum)
router.post("/create", uploadCloud.single("banner"), validate(courseSchema), courseController.createPost)

module.exports = router