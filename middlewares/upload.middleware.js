const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
      let folder = 'others';
      const extension = file.originalname.split('.').pop().toLowerCase();
      
      if (file.mimetype.startsWith('image/')) {
          folder = 'images';
      } else if (file.mimetype.startsWith('video/')) {
          folder = 'videos';
      } else if (
          file.mimetype === 'application/pdf' || 
          file.mimetype.includes('word') || 
          ['pdf', 'docx', 'doc'].includes(extension)
      ) {
          folder = 'documents';
      }
      return {
        folder: `e-learning/${folder}`, 
        resource_type: 'auto', 
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        flags: "attachment"
      };
  },
});

const uploadCloud = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn 50MB cho video
});

module.exports = uploadCloud;