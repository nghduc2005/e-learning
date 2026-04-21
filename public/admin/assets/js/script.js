const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('previewContainer');
const dropzoneContent = document.getElementById('dropzoneContent');
const removeImage = document.getElementById('removeImage');
if(imageInput) {
  imageInput.addEventListener('change', function() {
      const file = this.files[0];
      
      if (file) {
          // Tạo đường dẫn tạm thời cho file ảnh
          const objectURL = URL.createObjectURL(file);
          
          // Hiển thị ảnh vào thẻ img
          imagePreview.src = objectURL;
          
          // Hiện khung preview, ẩn khung dropzone ban đầu
          previewContainer.classList.remove('hidden');
          dropzoneContent.classList.add('hidden');
      }
  });
}
if(removeImage) {

  removeImage.addEventListener('click', function(e) {
      e.preventDefault(); // Ngăn chặn sự kiện click lan ra input
      imageInput.value = ""; // Xóa file trong input
      previewContainer.classList.add('hidden');
      dropzoneContent.classList.remove('hidden');
      
      // Giải phóng bộ nhớ (quan trọng để tránh rò rỉ bộ nhớ)
      URL.revokeObjectURL(imagePreview.src);
  });
}

const quill = new Quill('#editor', {
  modules: {
      toolbar: '#toolbar'
  },
  placeholder: 'Mô tả chi tiết khóa học...',
  theme: 'snow'
});

  // Xử lý dữ liệu trước khi Submit Form
  const form = document.querySelector('form');
  const descriptionInput = document.getElementById('description-input');
if(form) {

  form.onsubmit = function() {
      // Lấy nội dung HTML từ Editor
      const html = quill.root.innerHTML;
      
      // Nếu editor trống (chỉ có thẻ p rỗng), có thể xóa giá trị để yêu cầu nhập
      if (html === '<p><br></p>') {
          descriptionInput.value = "";
      } else {
          descriptionInput.value = html;
      }
  };
}

  document.querySelectorAll('.chapter-header').forEach(header => {
    
    header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const icon = this.querySelector('.arrow-icon');
        content.classList.toggle('hidden');
    });
});

function updateIndexes() {
  // 1. Cập nhật số Chương
  const chapters = document.querySelectorAll('.chapter-item');
  chapters.forEach((chapter, cIdx) => {
      const chapterNum = cIdx + 1;
      
      // Cập nhật vòng tròn số chương
      const numEl = chapter.querySelector('.chapter-number');
      if (numEl) numEl.innerText = chapterNum;

      // 2. Cập nhật số Bài học trong chương đó
      const lessons = chapter.querySelectorAll('.lesson-item');
      lessons.forEach((lesson, lIdx) => {
          const lessonNum = lIdx + 1;
          const titleEl = lesson.querySelector('.lesson-title');
          
          if (titleEl) {
              titleEl.innerText = `${chapterNum}.${lessonNum}`;
          }
      });

      // 3. Cập nhật text của nút "Thêm bài học mới"
      const addBtn = chapter.querySelector('.add-lesson-btn');
      if (addBtn) {
          addBtn.innerText = `+ Thêm bài học mới vào chương ${chapterNum}`;
      }
  });
}

const chaptersEl = document.getElementById('chapters-container');
if(chaptersEl) {
  new Sortable(chaptersEl, {
      animation: 150,
      handle: '.drag-handle', // Chỉ cho phép kéo khi nắm vào icon 6 chấm
      ghostClass: 'bg-indigo-50', // Màu nền khi đang kéo
      onEnd: function () {
        updateIndexes();
      },
  });

  // 2. Kéo thả cho các Bài học (Lặp qua tất cả các chương)
  document.querySelectorAll('.lessons-container').forEach(lessonList => {
      new Sortable(lessonList, {
          group: 'lessons', // Cho phép kéo bài học từ chương này sang chương khác
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'bg-indigo-50',
          onEnd: function (evt) {
            updateIndexes();
          },
      });
  });
}