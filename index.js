require('dotenv').config();
const express = require('express')
const path = require("path")
const cookieParser = require('cookie-parser');
const session = require('express-session');
const indexRoute = require("./routes/index.route")
//Config dự án
const app = express()
const port = 3000
app.use(express.json())
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
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

//Router
app.use(indexRoute)


app.listen(port, () => {
  console.log(`Đang lắng nghe cổng ${port}`)
})