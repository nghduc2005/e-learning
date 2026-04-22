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
  }
}

module.exports =  unitController