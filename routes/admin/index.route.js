const router = require('express').Router()
const courseRoute = require("./course.route")
const unitRoute = require("./unit.route")
const lessonRoute = require("./lesson.route")
router.use("/dashboard", (req, res) => {
  res.render("admin/dashboard", {
    title: "Tổng quan"
  })
})
router.use("/course", courseRoute)
router.use("/unit", unitRoute)
router.use("/lesson", lessonRoute)

module.exports = router