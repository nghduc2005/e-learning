const loadingOverlay = document.getElementById('loadingOverlay');
const validation = new JustValidate('#createUnitForm', {
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
const createCourseForm = document.getElementById("createCourseForm")
validation
    .addField('#title', [
        { rule: 'required', errorMessage: 'Tên chương không được để trống' },
    ], {
        errorsContainer: '#title-error'
    })
    .addField('#status', [
        {
        rule: 'required',
        errorMessage: 'Vui lòng chọn trạng thái chương',
        },
    ], {
        errorsContainer: '#status-error'
    })
    .onFail((fields) => {
        console.clear(); // Xóa log cũ trước khi hiện log mới
    })
    .onSuccess(async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form)
        const finalData = {
            title: formData.get("title"),
            status: formData.get("status")
        }
        loadingOverlay.classList.remove('hidden');
        try {
            const response = await axios.post("/admin/unit/create", finalData)
            if (response.data.data.ok) {
                window.location.href = "/admin/unit/list";
            }
        } catch (error) {
            console.error('Lỗi khi gửi dữ liệu:', error);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
        
    });