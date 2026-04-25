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
  },
  createPost: (req, res) => {
    console.log(req.body);
    console.log(req.files);
    
    res.json({
      data: req.body
    })
  }
}

module.exports = lessonController