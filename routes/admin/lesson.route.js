const lessonController = require('../../controllers/admin/lesson.controller')
const uploadCloud = require("../../middlewares/upload.middleware")
const { editLessonSchema, lessonSchema, validate } = require("../../middlewares/validate.middleware")

const router = require('express').Router()

router.get("/list", lessonController.list)
router.get("/create", lessonController.create)
router.post(
  "/create", 
    uploadCloud.fields([
      {name: 'content', maxCount: 1},
      {name: 'document', maxCount:3}
    ]),
  validate(lessonSchema),
lessonController.createPost)

router.get("/edit/:id", lessonController.edit)
router.post(
  "/edit/:id", 
    uploadCloud.fields([
      {name: 'content', maxCount: 1},
      {name: 'document', maxCount:3}
    ]),
  validate(editLessonSchema),
lessonController.editPost)

router.post("/delete/:id", lessonController.delete)
router.post("/restore/:id", lessonController.restore)

module.exports = router