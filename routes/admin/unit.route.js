import unitController from '../../controllers/admin/unit.controller.js'
import { validate, unitSchema } from '../../middlewares/validate.middleware.js'
import express from 'express'

const router = express.Router()

router.get("/list", unitController.list)
router.get("/create", unitController.create)
router.post("/create", validate(unitSchema), unitController.createPost)
router.get("/edit/:id", unitController.edit)
router.post("/edit/:id", validate(unitSchema), unitController.editPost)
router.post("/delete/:id", unitController.delete)
router.post("/restore/:id", unitController.restore)

export default router