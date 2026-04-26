import Joi from 'joi'

export const courseSchema = Joi.object({
  title: Joi.string().trim().min(1).max(256).required().messages({
    'string.base': 'Tên khóa học phải là một chuỗi văn bản.',
    'string.empty': 'Tên khóa học không được để trống.',
    'string.min': 'Tên khóa học phải có ít nhất {#limit} ký tự.',
    'string.max': 'Tên khóa học không được vượt quá {#limit} ký tự.',
    'any.required': 'Tên khóa học là trường bắt buộc.'
  }),
  status: Joi.string().valid('hidden', 'active', 'locked').messages({
    'any.only': 'Trạng thái phải là một trong các giá trị hợp lệ.'
  }),
  banner: Joi.string().pattern(/^https:\/\/res\.cloudinary\.com\//).messages({
    'string.pattern.base': 'Link ảnh banner phải bắt đầu bằng đường dẫn từ Cloudinary (https://res.cloudinary.com/).'
  }),
  description: Joi.string().trim().messages({
    'string.base': 'Mô tả phải là một chuỗi văn bản.'
  })
})

export const unitSchema = Joi.object({
  title: Joi.string().trim().min(1).max(256).required().messages({
    'string.base': 'Tên chương phải là một chuỗi văn bản.',
    'string.empty': 'Tên chương không được để trống.',
    'string.min': 'Tên chương phải có ít nhất {#limit} ký tự.',
    'string.max': 'Tên chương không được vượt quá {#limit} ký tự.',
    'any.required': 'Tên chương là trường bắt buộc.'
  }),
  status: Joi.string().valid('hidden', 'active', 'locked').messages({
    'any.only': 'Trạng thái phải là một trong các giá trị hợp lệ.'
  })
})

export const lessonSchema = Joi.object({
  title: Joi.string().trim().min(3).max(256).required().messages({
    'string.base': 'Tên bài học phải là một chuỗi văn bản.',
    'string.empty': 'Tên bài học không được để trống.',
    'string.min': 'Tên bài học phải có ít nhất {#limit} ký tự.',
    'string.max': 'Tên bài học không được vượt quá {#limit} ký tự.',
    'any.required': 'Tên bài học là trường bắt buộc.'
  }),
  status: Joi.string().valid('hidden', 'active', 'locked').required().messages({
    'any.only': 'Trạng thái phải là một trong các giá trị: Ẩn, Khóa, hoặc Hoạt động.',
    'any.required': 'Trạng thái là trường bắt buộc.'
  }),
  learnMode: Joi.string().valid('video', 'article').required().messages({
    'any.only': 'Chế độ học không hợp lệ.',
    'any.required': 'Chế độ học là trường bắt buộc.'
  }),
  score: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số câu hỏi cần đạt phải là một số.',
    'number.min': 'Số câu hỏi cần đạt không được nhỏ hơn 0.',
    'any.required': 'Số câu hỏi cần đạt là trường bắt buộc.'
  }),
  content: Joi.string().pattern(/^https:\/\/res\.cloudinary\.com\//).required().messages({
    'string.pattern.base': 'Link nội dung bài giảng phải là đường dẫn hợp lệ từ Cloudinary.',
    'any.required': 'Nội dung bài giảng là bắt buộc.'
  }),
  document: Joi.array().items(
    Joi.string().pattern(/^https:\/\/res\.cloudinary\.com\//)
  ).max(3).messages({
    'array.max': 'Tối đa chỉ được phép có 3 tài liệu.',
    'string.pattern.base': 'Link tài liệu phải bắt đầu từ Cloudinary.'
  }),
  questionsList: Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return helpers.error('any.invalid');
      return parsed;
    } catch (e) {
      return helpers.error('any.invalid');
    }
  }).optional().messages({
    'any.invalid': 'Danh sách câu hỏi không đúng định dạng.'
  })
})

export const editLessonSchema = Joi.object({
  title: Joi.string().trim().min(3).max(256).required().messages({
    'string.base': 'Tên bài học phải là một chuỗi văn bản.',
    'string.empty': 'Tên bài học không được để trống.',
    'string.min': 'Tên bài học phải có ít nhất {#limit} ký tự.',
    'string.max': 'Tên bài học không được vượt quá {#limit} ký tự.',
    'any.required': 'Tên bài học là trường bắt buộc.'
  }),
  status: Joi.string().valid('hidden', 'active', 'locked').required().messages({
    'any.only': 'Trạng thái phải là một trong các giá trị: Ẩn, Khóa, hoặc Hoạt động.',
    'any.required': 'Trạng thái là trường bắt buộc.'
  }),
  learnMode: Joi.string().valid('video', 'article').required().messages({
    'any.only': 'Chế độ học không hợp lệ.',
    'any.required': 'Chế độ học là trường bắt buộc.'
  }),
  score: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số câu hỏi cần đạt phải là một số.',
    'number.min': 'Số câu hỏi cần đạt không được nhỏ hơn 0.',
    'any.required': 'Số câu hỏi cần đạt là trường bắt buộc.'
  }),
  content: Joi.string().pattern(/^https:\/\/res\.cloudinary\.com\//).optional().messages({
    'string.pattern.base': 'Link nội dung bài giảng phải là đường dẫn hợp lệ từ Cloudinary.'
  }),
  document: Joi.array().items(
    Joi.string().pattern(/^https:\/\/res\.cloudinary\.com\//)
  ).max(3).messages({
    'array.max': 'Tối đa chỉ được phép có 3 tài liệu.',
    'string.pattern.base': 'Link tài liệu phải bắt đầu từ Cloudinary.'
  }),
  questionsList: Joi.string().custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return helpers.error('any.invalid');
      return parsed;
    } catch (e) {
      return helpers.error('any.invalid');
    }
  }).optional().messages({
    'any.invalid': 'Danh sách câu hỏi không đúng định dạng.'
  })
})
export const validate = (schema) => {
  return (req, res, next) => {
      if(req.file) {
        // Trong trường hợp upload .single(), req.file CHÍNH LÀ đối tượng file, KHÔNG CÓ key là tên field
        req.body[req.file.fieldname] = req.file.path;
      }
      if (req.files) {
        // Trong trường hợp .fields(), req.files là Object chứa các mảng file
        if (req.files['content'] && req.files['content'][0]) {
          req.body.content = req.files['content'][0].path; 
        }
        if (req.files['document']) {
          req.body.document = req.files['document'].map(file => file.path);
        }
      }
      const { error, value } = schema.validate(req.body, { 
        abortEarly: false,  // Lấy tất cả lỗi cùng lúc
        allowUnknown: true, // Cho phép các trường multer tự sinh (như file nội bộ)
        stripUnknown: true  // Loại bỏ các trường không định nghĩa trong schema
      });
      if (error) {
        const errorMessage = error.details.map(details => details.message).join(', ');
        
        return res.status(400).json({ 
          success: false,
          message: errorMessage 
        });
      }
      req.body = value;
      
      next();
  };
};