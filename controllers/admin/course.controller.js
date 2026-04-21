export const courseController = {
  list: (req, res) => {
    res.render("admin/courseList", {
      title: "Danh sách khóa học"
    })
  },
  create: (req, res) => {
    res.render("admin/courseCreate", {
      title: "Tạo khóa học"
    })
  },
  curriculum: (req, res) => {
    res.render("admin/curriculum", {
      title: "Chương trình học"
    })
  },
  createPost: (req, res) => {
    console.log(req.body);
    
    res.json({
      ok: true
    })
  }
  
}