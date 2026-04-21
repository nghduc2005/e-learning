require('dotenv').config();
const express = require('express')
const expressLayouts = require('express-ejs-layouts');
const path = require("path")
const cookieParser = require('cookie-parser');
const session = require('express-session');
const adminRoute = require("./routes/admin/index.route")
const clientRoute = require("./routes/client/index.route")
//Config dự án
const app = express()
const port = 3000
app.use(express.json({ limit: '50mb' }))
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true, 
  parameterLimit: 50000 
}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, //Không thay đổi không lưu lại
  saveUninitialized: false, // Chỉ tạo session khi có dữ liệu được lưu
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // Thời gian sống cookie: 1 ngày
    secure: false, // deploy đặt true
    httpOnly: true
  }
}));
//Đăng ký layout
app.use(expressLayouts)
app.set("layout extractScripts", true)
app.set("layout extractStyles", true)
app.use((req, res, next) => {
  const url = req.url
  if(url.startsWith("/admin")) {
    app.set("layout", "layouts/admin.layouts.ejs")
  } else {
    app.set("layout", "layouts/client.layouts.ejs")
  }
  next()
})

//Router
app.use('/admin', adminRoute)
app.use('/', clientRoute)

app.listen(port, () => {
  console.log(`Đang lắng nghe cổng ${port}`)
})