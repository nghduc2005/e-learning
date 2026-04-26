const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folderType = 'others';
        const extension = file.originalname.split('.').pop().toLowerCase();
        
        // Xác định folder dựa trên loại file
        if (file.mimetype.startsWith('image/')) {
            folderType = 'images';
        } else if (file.mimetype.startsWith('video/')) {
            folderType = 'videos';
        } else {
            folderType = 'documents';
        }

        return {
            folder: `e-learning/${folderType}`,
            resource_type: 'auto', // Quan trọng để nhận diện video/docs
            // Loại bỏ dấu tiếng Việt và khoảng trắng để tránh lỗi 400
            public_id: `${Date.now()}-${file.fieldname}`, 
            // Cho phép các định dạng tài liệu
            access_mode: 'authenticated',
            flags: folderType === 'documents' ? "attachment" : undefined
        };
    },
});

const uploadCloud = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Tăng lên 100MB cho thoải mái
    fileFilter: (req, file, cb) => {
        // Kiểm tra định dạng file trước khi đẩy lên Cloudinary để tránh tốn băng thông lỗi
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/quicktime',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Định dạng file không được hỗ trợ!'), false);
        }
    }
});

module.exports = uploadCloud;