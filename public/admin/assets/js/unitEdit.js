const loadingOverlay = document.getElementById('loadingOverlay');
const validation = new JustValidate('#editUnitForm', {
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
        console.clear();
    })
    .onSuccess(async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form)
        const finalData = {
            title: formData.get("title"),
            status: formData.get("status")
        }
        
        const actionUrl = form.getAttribute("action");

        loadingOverlay.classList.remove('hidden');
        try {
            const response = await axios.post(actionUrl, finalData)
            if (response.data.data.ok) {
                if (window.opener) { window.close(); } else { window.history.back(); }
            }
        } catch (error) {
            console.error('Lỗi khi gửi dữ liệu:', error);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
        
    });
