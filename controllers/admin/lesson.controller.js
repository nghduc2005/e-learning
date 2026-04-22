const lessonController = {
  list: (req, res) => {
    res.render("admin/lessonList", {
      title: "Danh sách bài học"
    })
  },
  create: (req, res) => {
    res.render("admin/lessonCreate", {
      title: "Tạo bài học"
    })
  }
}

module.exports = lessonController