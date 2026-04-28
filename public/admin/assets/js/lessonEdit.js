const editLessonForm = document.getElementById("editLessonForm");

function updateFileName(input) {
    const display = document.getElementById('fileNameDisplay');
    const listContainer = document.getElementById('fileListContainer');
    const files = input.files;

    listContainer.innerHTML = '';

    if (files && files.length > 0) {
        display.classList.remove('italic');
        display.classList.add('text-gray-900', 'font-medium');
        display.innerText = `${files.length} file đã được chọn`;

        Array.from(files).forEach((file, index) => {
            const fileRow = document.createElement('div');
            fileRow.className = "flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 animate-fadeIn";
            
            fileRow.innerHTML = `
                <div class="flex items-center overflow-hidden">
                    <svg class="w-4 h-4 text-indigo-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-xs text-gray-600 truncate">${file.name}</span>
                </div>
                <span class="text-[10px] text-gray-400">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            `;
            listContainer.appendChild(fileRow);
        });
    } else {
        display.classList.add('italic');
        display.innerText = "Chưa chọn file...";
    }
}

function toggleUploadMode(mode) {
    const fileInput = document.getElementById('content');
    const fileLabel = document.getElementById('fileLabel');
    const fileHint = document.getElementById('fileHint');
    const fileIcon = document.getElementById('fileIcon');
    const fileNameDisplay = document.getElementById('contentFileName');

    fileInput.value = "";
    fileNameDisplay.innerText = fileNameDisplay.getAttribute('data-initial-content') ? "Đã có tài liệu lưu trữ (Chọn để đổi)" : "Chưa có file nào...";
    if (!fileNameDisplay.getAttribute('data-initial-content')) {
        fileNameDisplay.classList.add('italic');
        fileNameDisplay.classList.remove('text-gray-900', 'font-medium');
    }

    if (mode === 'video') {
        fileLabel.innerHTML = 'Video bài giảng <span class="text-red-600">*</span>';
        fileInput.accept = "video/*";
        fileHint.innerText = "* Hỗ trợ: MP4, WebM, MOV (Tối đa 50MB). Không bắt buộc tải lại file nếu muốn giữ file cũ.";
        fileIcon.innerHTML = `
            <svg class="w-6 h-6 text-indigo-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>`;
    } else {
        fileLabel.innerHTML = 'Tài liệu bài giảng <span class="text-red-600">*</span>';
        fileInput.accept = ".pdf,.docx";
        fileHint.innerText = "* Hỗ trợ: PDF, DOCX (Tối đa 10MB). Không bắt buộc tải lại file nếu muốn giữ file cũ.";
        fileIcon.innerHTML = `
            <svg class="w-6 h-6 text-indigo-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>`;
    }
}

function handleFileSelect(input) {
    const display = document.getElementById('contentFileName');
    if (input.files.length > 0) {
        display.innerText = input.files[0].name;
        display.classList.remove('italic', 'text-gray-400');
        display.classList.add('text-gray-900', 'font-medium');
    }
}

let questionCount = 0;
let uniqueQuestionId = 0;
function addQuestion(initialData = null) {
  uniqueQuestionId++;
  const uid = uniqueQuestionId;

  const container = document.getElementById('questionContainer');
  const questionDiv = document.createElement('div');
  
  questionDiv.className = "question-block w-full flex flex-col gap-4 p-6 bg-gray-50 border border-gray-100 rounded-2xl relative animate-fade-in mb-4";
  questionDiv.setAttribute('id', `question-block-${uid}`);

  const contentValue = initialData ? initialData.content : "";
  const answers = initialData ? initialData.answers : ["", "", "", ""];
  const correctIdx = initialData ? initialData.correctAnswer : -1;

  questionDiv.innerHTML = `
    <div class="flex items-center justify-between border-b border-gray-200 pb-3">
        <span class="question-number text-xs font-black text-indigo-500 uppercase tracking-widest">Câu hỏi</span>
        <button type="button" onclick="removeQuestion(${uid})" class="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        </button>
    </div>
    <div class="flex flex-col gap-2">
        <input type="text" id="q-content-${uid}" data-validate="q-input" placeholder="Nhập nội dung câu hỏi..." value="${contentValue.replace(/"/g, '&quot;')}"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all text-gray-700 bg-white">
    </div>
    <div id="radio-group-${uid}" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
        ${[0, 1, 2, 3].map(i => `
            <div class="relative flex flex-col">
                <div class="relative flex items-center">
                    <input type="text" id="q-ans-${uid}-${i}" data-validate="ans-input" placeholder="Đáp án ${String.fromCharCode(65 + i)}" value="${(answers[i]||'').replace(/"/g, '&quot;')}"
                        class="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-200 outline-none transition-all">
                    <label class="absolute left-3 flex items-center cursor-pointer">
                        <input type="radio" name="correctAnswer_${uid}" value="${i}" class="w-5 h-5 text-indigo-600 cursor-pointer" ${correctIdx === i ? 'checked' : ''}>
                    </label>
                </div>
            </div>
        `).join('')}
    </div>
  `;
  
  container.appendChild(questionDiv);

  validation.addField(`#q-content-${uid}`, [
      { rule: 'required', errorMessage: 'Nội dung câu hỏi không được trống' },
      { rule: 'minLength', value: 5, errorMessage: 'Câu hỏi phải có ít nhất 5 ký tự' }
  ]);

  [0, 1, 2, 3].forEach(i => {
      validation.addField(`#q-ans-${uid}-${i}`, [
          { rule: 'required', errorMessage: `Nhập đáp án ${String.fromCharCode(65 + i)}` }
      ]);
  });

  validation.addRequiredGroup(
      `#radio-group-${uid}`,
      'Bạn chưa chọn đáp án đúng'
  );

  updateQuestionUI();
  updateScoreOptions();
}

function removeQuestion(uid) {
  validation.removeField(`#q-content-${uid}`);
  [0, 1, 2, 3].forEach(i => validation.removeField(`#q-ans-${uid}-${i}`));
  validation.removeGroup(`#radio-group-${uid}`);

  const block = document.getElementById(`question-block-${uid}`);
  if (block) block.remove();

  updateQuestionUI();
  updateScoreOptions();
}

function updateQuestionUI() {
  const blocks = document.querySelectorAll('.question-block');
  blocks.forEach((block, index) => {
      const titleSpan = block.querySelector('.question-number');
      if (titleSpan) {
          titleSpan.innerText = `Câu hỏi số ${index + 1}`;
      }
  });
}

function updateScoreOptions() {
  const scoreSelect = document.getElementById('score');
  const questionBlocks = document.querySelectorAll('.question-block');
  const totalQuestions = questionBlocks.length;
  const currentSelected = scoreSelect.value || scoreSelect.getAttribute('data-initial-score');

  scoreSelect.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = "0"; 
  defaultOption.text = "0 câu (Không yêu cầu)";
  scoreSelect.appendChild(defaultOption);

  for (let i = 1; i <= totalQuestions; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.text = `Đạt ${i}/${totalQuestions} câu`;
      scoreSelect.appendChild(option);
  }

  if (currentSelected && parseInt(currentSelected) <= totalQuestions) {
      scoreSelect.value = currentSelected;
  } else {
      scoreSelect.value = "0"; 
  }
  
  validation.revalidateField('#score');
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.initialQuestions && window.initialQuestions.length > 0) {
        window.initialQuestions.forEach(q => addQuestion(q));
    }
});

const loadingOverlay = document.getElementById('loadingOverlay');
const validation = new JustValidate('#editLessonForm', {
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
    { rule: 'required', errorMessage: 'Vui lòng nhập tên bài học' },
    { rule: 'minLength', value: 3, errorMessage: 'Tên bài học phải ít nhất 3 ký tự' },
    { rule: 'maxLength', value: 256, errorMessage: 'Tên bài học quá dài' },
    ])
    .addField('#status', [
    { rule: 'required', errorMessage: 'Vui lòng chọn trạng thái' },
    ])
    .addField('#content', [
        {
            validator: (value, fields) => {
                const fileInput = document.getElementById('content');
                const file = fileInput.files[0];
                if (!file) return true; // file không bắt buộc khi cập nhật

                const extension = file.name.split('.').pop().toLowerCase();
                const mode = document.getElementById('learnMode').value;

                if (mode === 'video') {
                    const videoExtensions = ['mp4', 'webm', 'mov'];
                    return videoExtensions.includes(extension) && file.size <= 50 * 1024 * 1024;
                } 
                
                if (mode === 'article') {
                    const docExtensions = ['pdf', 'docx'];
                    return docExtensions.includes(extension) && file.size <= 10 * 1024 * 1024;
                }
                return false;
            },
            errorMessage: 'File không tồn tại hoặc không đúng theo định dạng/dung lượng khuyến nghị!',
        }
    ])
    .addField('#score', [
        {
            validator: (value) => {
                const numRequired = parseInt(value);
                const actualQuestions = document.querySelectorAll('.question-block').length;
                if (numRequired === 0) return true;
                
                return numRequired <= actualQuestions;
            },
            errorMessage: 'Số câu đạt không được vượt quá tổng số câu hỏi hiện có'
        }
    ])
    .addField('#document', [
        {
            validator: (files) => {
            if (!files || files.length === 0) return true;
            if(files.length >3) {
                return false;
            }
            const allowedExts = ['pdf', 'docx'];
            const maxSize = 10485760;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const extension = file.name.split('.').pop().toLowerCase();
                if (!allowedExts.includes(extension) || file.size > maxSize) {
                    return false;
                }
            }
            return true;
        },
        errorMessage: 'Tối đa 3 file PDF/Docx và không quá 10MB/file',
        }
    ])
    .onFail((fields) => {
        console.clear(); 
    })
    .onSuccess(async (event) => {
      event.preventDefault();
      if(loadingOverlay) loadingOverlay.classList.remove('hidden');

      const form = event.target;
      const formData = new FormData(form);
      
      const questionBlocks = document.querySelectorAll('.question-block');
      const questionsList = Array.from(questionBlocks).map((block, idx) => {
          return {
              content: block.querySelector('input[data-validate="q-input"]').value,
              answers: Array.from(block.querySelectorAll('input[data-validate="ans-input"]')).map(i => i.value),
              correctAnswer: parseInt(block.querySelector('input[type="radio"]:checked').value)
          };
      });
  
      formData.append('questionsList', JSON.stringify(questionsList))
      
      try {
          const response = await axios.post("/admin/lesson/edit/" + window.editLessonId, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              }
          })
          if (response.data.redirectUrl) {
              if (window.opener) { window.close(); } else { window.history.back(); }
          }
      } catch (error) {
          console.log(error.response?.data || error);
      } finally {
          if(loadingOverlay) loadingOverlay.classList.add('hidden');
      }
    });
