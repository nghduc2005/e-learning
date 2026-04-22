const unitController  = require('../../controllers/admin/unit.controller')

const router = require('express').Router()

router.get("/list", unitController.list)
router.get("/create", unitController.create)

module.exports = router