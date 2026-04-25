const lessonController = require('../../controllers/admin/lesson.controller')
const uploadCloud = require('../../middlewares/upload.middleware')

const router = require('express').Router()

router.get("/list", lessonController.list)
router.get("/create", lessonController.create)
router.post("/create", uploadCloud.fields([
  {name: 'content', maxCount: 1},
  {name: 'document', maxCount:3}
]), lessonController.createPost)

module.exports = router