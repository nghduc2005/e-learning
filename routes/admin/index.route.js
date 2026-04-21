const router = require('express').Router()
const courseRoute = require("./course.route")
router.use("/dashboard", (req, res) => {
  res.render("admin/dashboard", {
    title: "Tổng quan"
  })
})
router.use("/", courseRoute)

module.exports = router