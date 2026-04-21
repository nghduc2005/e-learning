const router = require('express').Router()
const courseRoute = require("./course.route")
router.use("/", courseRoute)

module.exports = router