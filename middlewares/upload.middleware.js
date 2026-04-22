const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'course-banner',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], 
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // giới hạn kích thước
      { quality: 'auto' }, // tự động nén để giảm dung lượng
      { fetch_format: 'auto' } // tự động chọn định dạng tốt nhất
    ],
  },
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng file không hợp lệ!'), false);
    }
  }
});

module.exports = upload;