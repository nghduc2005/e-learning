const router = require('express').Router()
const courseRoute = require("./course.route")
const unitRoute = require("./unit.route").default || require("./unit.route")
const lessonRoute = require("./lesson.route")
const trashRoute = require("./trash.route")

router.use("/dashboard", (req, res) => {
  res.render("admin/dashboard", {
    title: "Tổng quan"
  })
})
router.use("/course", courseRoute)
router.use("/unit", unitRoute)
router.use("/lesson", lessonRoute)
router.use("/trash", trashRoute)

module.exports = router