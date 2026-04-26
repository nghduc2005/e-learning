const loadingOverlay = document.getElementById('loadingOverlay');
const validation = new JustValidate('#editCourseForm', {
    errorFieldCssClass: 'border-red-500',
    errorLabelStyle: {
        color: '#dc2626',
        fontSize: '12px',
        marginTop: '4px'
    },
    allowHTMLAnswerErrors: true,
    shouldAddErrorClasses: true,
    refreshValuesOnValidation: true,
    lockForm: true
});

const quill = new Quill('#editor', {
    modules: {
        toolbar: '#toolbar'
    },
    placeholder: 'Mô tả chi tiết khóa học...',
    theme: 'snow'
});

// Điền lại dữ liệu description cũ vào Quill (nếu có)
if (window.INITIAL_COURSE_DESC) {
    quill.clipboard.dangerouslyPasteHTML(window.INITIAL_COURSE_DESC);
    document.querySelector('#description').value = window.INITIAL_COURSE_DESC;
}

const editCourseForm = document.getElementById("editCourseForm");

validation
    .addField('#title', [
        { rule: 'required', errorMessage: 'Tên khóa học không được để trống' },
    ], {
        errorsContainer: '#title-error'
    })
    .addField('#status', [
        {
        rule: 'required',
        errorMessage: 'Vui lòng chọn trạng thái khóa học',
        },
    ], {
        errorsContainer: '#status-error'
    })
    .addField('#banner', [
        {
        rule: 'files',
        value: {
            files: {
            extensions: ['jpeg', 'jpg', 'png', 'webp'],
            maxSize: 2000000, // 2MB
            types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            },
        },
        errorMessage: 'File phải là ảnh (jpg, png, webp) và nhỏ hơn 2MB',
        },
    ], {
        errorsContainer: '#banner-error'
    })
    .addField('#description', [
        {
            validator: (value) => {
                const html = quill.root.innerHTML;
                const descriptionInput = document.querySelector('#description');
                if (html === '<p><br></p>') {
                    descriptionInput.value = "";
                } else {
                    descriptionInput.value = html;
                }
                return true;
            },
        }
    ], {
        errorsContainer: '#description-error'
    })
    .onFail((fields) => {
        console.clear(); 
    })
    .onSuccess(async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        // Thêm cờ xóa banner nếu người dùng bấm dấu X đỏ
        const removeImageBtn = document.getElementById('removeImage');
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview && imagePreview.src.includes('#')) {
            formData.append('deleteBanner', 'true');
        }

        loadingOverlay.classList.remove('hidden');
        try {
            // Đọc Action URL đã định nghĩa sẵn ở HTML: action="/admin/course/edit/<%= course.id %>"
            const actionUrl = form.getAttribute('action');
            const response = await axios.post(actionUrl, formData);
            console.log(response.data);
            
            // Xử lý sau khi thành công
            if (response.data.data.ok) {
                // Ví dụ redirect về danh sách
                // window.location.href = "/admin/course/list";
            }
        } catch (error) {
            console.error('Lỗi khi gửi dữ liệu cập nhật:', error);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });
