const imageInput = document.getElementById('banner');
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


// Force reload when page is loaded from Back-Forward Cache (BFCache)
// Fixes issue where returning to list page shows old data after create/update/delete
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});
