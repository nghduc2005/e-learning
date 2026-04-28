const loadingOverlay = document.getElementById('loadingOverlay');
    const validation = new JustValidate('#createCourseForm', {
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
    const createCourseForm = document.getElementById("createCourseForm")
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
                    return true
                },
                // errorMessage: 'Vui lòng nhập mô tả chi tiết khóa học',
            }
        ], {
            errorsContainer: '#description-error'
        })
        .onFail((fields) => {
            console.clear(); // Xóa log cũ trước khi hiện log mới
        })
        .onSuccess(async (event) => {
            event.preventDefault();
            const form = event.target;
            console.log(form);
            
            const formData = new FormData(form);
            loadingOverlay.classList.remove('hidden');
            try {
                const response = await axios.post("/admin/course/create", formData)
                if (response.data.data.ok) {
                    if (window.opener) { window.close(); } else { window.history.back(); }
                }
            } catch (error) {
                console.error('Lỗi khi gửi dữ liệu:', error);
            } finally {
                loadingOverlay.classList.add('hidden');
            }
            
        });
    