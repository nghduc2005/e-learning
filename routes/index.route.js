const router = require('express').Router()
const courseRoute = require("../routes/course.route")
router.use("/", courseRoute)

module.exports = router