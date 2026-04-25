const unitController = {
  list: (req, res) => {
    res.render("admin/unitList", {
      title: "Danh sách chương"
    })
  },
  create: (req, res) => {
    res.render("admin/unitCreate", {
      title: "Tạo chương"
    })
  },
  createPost: (req, res) => {
    console.log(req.body);
    res.json({
      data: {
        ok: 1
      }
    })
  }
}

module.exports =  unitController