const unitController  = require('../../controllers/admin/unit.controller')
const { validate, unitSchema } = require('../../middlewares/validate.middleware')

const router = require('express').Router()

router.get("/list", unitController.list)
router.get("/create", unitController.create)
router.post("/create", validate(unitSchema), unitController.createPost)

module.exports = router