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

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false, // Trả về tất cả các lỗi thay vì dừng lại ở lỗi đầu tiên
      allowUnknown: true, // Cho phép các trường không định nghĩa trong schema
      stripUnknown: true  // Loại bỏ các trường thừa không có trong schema
    });
    if (error) {
      const errorMessage = error.details.map(details => details.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
    
    next();
  };
};