/* =====================================================
   learn.js – Client logic for the lesson learning page
   ===================================================== */

const CFG = window.LEARN_CONFIG || {};

// ─── Helpers ────────────────────────────────────────

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

async function apiFetch(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Tab switching ───────────────────────────────────

const tabBar  = document.getElementById('tab-bar');
const tabBody = document.getElementById('tab-body');

if (tabBar && tabBody) {
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const target = btn.dataset.tab;

    tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    tabBody.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(`pane-${target}`);
    if (pane) pane.classList.add('active');
  });

  // If URL has #tab-comments, activate that tab on load
  if (window.location.hash === '#tab-comments') {
    const cmtBtn = tabBar.querySelector('[data-tab="comments"]');
    if (cmtBtn) cmtBtn.click();
  }
}

// ─── Complete button ─────────────────────────────────

const completeBtn = document.getElementById('complete-btn');

if (completeBtn && !completeBtn.disabled) {
  completeBtn.addEventListener('click', async () => {
    completeBtn.disabled = true;
    completeBtn.textContent = 'Đang lưu...';

    const data = await apiFetch(
      `/learn/${CFG.courseId}/${CFG.lessonId}/complete`,
      {}
    );

    if (data.success) {
      completeBtn.classList.add('is-done');
      completeBtn.textContent = 'Đã hoàn thành';

      // Update sidebar icon for this lesson
      const sidebarLink = document.querySelector(
        `.lesson-link[href="/learn/${CFG.courseId}/${CFG.lessonId}"]`
      );
      if (sidebarLink) {
        const icon = sidebarLink.querySelector('.l-status-icon');
        if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check done"></i>';
      }

      showToast('Đã đánh dấu hoàn thành!');
    } else {
      completeBtn.disabled = false;
      completeBtn.textContent = 'Đánh dấu hoàn thành';
      showToast('Có lỗi xảy ra, thử lại sau.', 'error');
    }
  });
}

// ─── Quiz form ───────────────────────────────────────

const quizForm   = document.getElementById('quiz-form');
const resultBanner = document.getElementById('quiz-result-banner');

if (quizForm) {
  quizForm.addEventListener('submit', async e => {
    e.preventDefault();

    const total   = parseInt(quizForm.dataset.total);
    const answers = {};

    for (let i = 0; i < total; i++) {
      const selected = quizForm.querySelector(`input[name="q_${i}"]:checked`);
      if (!selected) {
        showToast(`Vui lòng trả lời câu ${i + 1}`, 'error');
        return;
      }
      answers[i] = selected.value;
    }

    const submitBtn = document.getElementById('quiz-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang chấm...';

    // LẤY TRỰC TIẾP ID MỚI NHẤT TRƯỚC KHI GỬI
    const currentConfig = window.LEARN_CONFIG || CFG;

    // Nếu vẫn không có ID, chặn không cho gửi
    if (!currentConfig.courseId || !currentConfig.lessonId) {
       showToast('Lỗi giao diện: Không tìm thấy ID bài học.', 'error');
       submitBtn.disabled = false;
       submitBtn.textContent = 'Nộp bài';
       return;
    }

    const data = await apiFetch(
      `/learn/${currentConfig.courseId}/${currentConfig.lessonId}/quiz`,
      { answers }
    );

    if (!data.success) {
      // ĐÃ SỬA: Lấy chính xác thông báo lỗi từ backend truyền lên
      showToast(data.message || 'Có lỗi xảy ra, thử lại sau.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Nộp bài';
      return;
    }

    // Reveal correct / wrong per question
    data.results.forEach((r, qi) => {
      const optsContainer = document.getElementById(`opts-${qi}`);
      if (!optsContainer) return;
      optsContainer.querySelectorAll('.answer-label').forEach(label => {
        label.style.pointerEvents = 'none';
        const ai = parseInt(label.dataset.ai);
        const input = label.querySelector('input');
        const wasSelected = input && input.checked;

        if (ai === r.correctAnswer) {
          label.classList.add(wasSelected ? 'selected-correct' : 'correct');
        } else if (wasSelected) {
          label.classList.add('selected-wrong');
        }
      });
    });

    // Show result banner
    const isPassed = data.isPassed;
    resultBanner.style.display = 'flex';
    resultBanner.className = `quiz-result-banner ${isPassed ? 'passed' : 'failed'}`;
    resultBanner.innerHTML = isPassed
      ? `✓ Xuất sắc! Bạn đạt <strong>${data.score}%</strong> — Đạt yêu cầu (<strong>${data.passScore}%</strong>)`
      : `✗ Bạn đạt ${data.score} — Chưa đủ điểm đạt (${data.passScore}). Hãy thử lại!`;

    submitBtn.textContent = 'Đã nộp';

    // If passed: update complete btn + sidebar
    if (isPassed) {
      if (completeBtn) {
        completeBtn.classList.add('is-done');
        completeBtn.textContent = 'Đã hoàn thành';
        completeBtn.disabled = true;
      }
      // Update tab label
      const quizTabBtn = tabBar && tabBar.querySelector('[data-tab="quiz"]');
      if (quizTabBtn) quizTabBtn.textContent = 'Kiểm tra ✓';
      showToast('Chúc mừng! Bạn đã vượt qua bài kiểm tra.', 'success');
    } else {
      showToast(`Bạn đạt ${data.score}%. Cần ${data.passScore}% để đạt.`, 'error');
    }
  });
}

// Retake button
const retakeBtn = document.getElementById('retake-btn');
if (retakeBtn && quizForm) {
  retakeBtn.addEventListener('click', () => {
    document.getElementById('best-score-card').style.display = 'none';
    quizForm.style.display = 'block';
    quizForm.reset();
    if (resultBanner) resultBanner.style.display = 'none';
    // Re-enable submit
    const submitBtn = document.getElementById('quiz-submit');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Nộp bài'; }
    // Clear reveal classes
    quizForm.querySelectorAll('.answer-label').forEach(l => {
      l.classList.remove('correct', 'wrong', 'selected-correct', 'selected-wrong');
      l.style.pointerEvents = '';
    });
  });
}

// ─── Reply toggle ─────────────────────────────────────

function toggleReply(commentId) {
  const form = document.getElementById(`reply-${commentId}`);
  if (!form) return;
  const isVisible = form.style.display !== 'none' && form.style.display !== '';
  form.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    const ta = form.querySelector('textarea');
    if (ta) ta.focus();
  }
}

// ─── Report modal ─────────────────────────────────────

let _reportCommentId = null;

function openReport(commentId) {
  _reportCommentId = commentId;
  const overlay = document.getElementById('report-overlay');
  const ta = document.getElementById('report-reason');
  if (overlay) overlay.style.display = 'flex';
  if (ta) { ta.value = ''; ta.focus(); }
}

function closeReport() {
  _reportCommentId = null;
  const overlay = document.getElementById('report-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function submitReport() {
  if (!_reportCommentId) return;
  const reason = document.getElementById('report-reason').value.trim();
  if (!reason) { showToast('Vui lòng nhập lý do báo cáo', 'error'); return; }

  const data = await apiFetch(
    `/learn/${CFG.courseId}/${CFG.lessonId}/comments/${_reportCommentId}/report`,
    { reason }
  );

  closeReport();
  if (data.success) {
    showToast('Đã gửi báo cáo. Cảm ơn bạn!', 'success');
  } else {
    showToast(data.message || 'Có lỗi xảy ra.', 'error');
  }
}

// Close report overlay on backdrop click
document.addEventListener('click', e => {
  const overlay = document.getElementById('report-overlay');
  if (overlay && e.target === overlay) closeReport();
});

// ─── Video progress tracking ──────────────────────────

// ─── Video progress tracking (Sử dụng YouTube API) ───

if (CFG.learnMode === 'video') {
  const video = document.getElementById('lesson-video');
  
  if (video) {
    // Lấy tiến độ cũ từ backend nếu có để không bắt đầu lại từ 0
    let lastSentPercent = window.LEARN_CONFIG && window.LEARN_CONFIG.isCompleted 
        ? 100 
        : (window.LEARN_CONFIG ? window.LEARN_CONFIG.watchPercent || 0 : 0);

    function sendProgress(percent) {
      if (percent <= lastSentPercent) return;
      lastSentPercent = percent;
      
      navigator.sendBeacon
        ? navigator.sendBeacon(`/learn/${CFG.courseId}/${CFG.lessonId}/progress`,
            new Blob([JSON.stringify({ watchPercent: percent })],
              { type: 'application/json' }))
        : apiFetch(`/learn/${CFG.courseId}/${CFG.lessonId}/progress`,
            { watchPercent: percent });
    }

    // Sự kiện 'timeupdate' tự động chạy liên tục khi video đang phát
    video.addEventListener('timeupdate', () => {
  const duration = video.duration;
  const currentTime = video.currentTime;
  
  // Chặn trường hợp duration là NaN hoặc 0
  if (duration > 0 && !isNaN(duration)) {
    const percent = Math.floor((currentTime / duration) * 100);
    
    // Đảm bảo percent là một số hợp lệ trước khi tính toán gửi
    if (!isNaN(percent)) {
      if (percent - lastSentPercent >= 5) {
        sendProgress(percent);
      }
    }
  }
});

    // Khi video xem xong
    video.addEventListener('ended', () => {
      sendProgress(100);
      
      const completeBtn = document.getElementById('complete-btn');
      if (completeBtn && !completeBtn.disabled) {
        completeBtn.click();
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('comment-form');
  const commentsList = document.querySelector('.comments-list');

  // 1. Xử lý Gửi bình luận mới
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Chặn hành vi tải lại trang

      const textarea = commentForm.querySelector('textarea[name="content"]');
      const content = textarea.value.trim();
      const url = commentForm.getAttribute('action');

      if (!content) return alert('Vui lòng nhập nội dung bình luận!');

      try {
        // Gửi dữ liệu lên server bằng Fetch API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json' // Báo cho server biết ta muốn nhận JSON
          },
          body: JSON.stringify({ content: content })
        });

        const data = await response.json();

        if (data.success) {
          const newCommentHTML = createCommentHTML(data.comment);
          
          const emptyMsg = commentsList.querySelector('p');
          if (emptyMsg && emptyMsg.textContent.includes('Chưa có')) {
            emptyMsg.remove();
          }

          commentsList.insertAdjacentHTML('afterbegin', newCommentHTML);
          
          commentForm.reset();
          showToast('Đã gửi bình luận thành công!', 'success'); // Hàm showToast bạn đã làm ở CSS
        } else {
          showToast(data.message || 'Lỗi khi gửi bình luận', 'error');
        }
      } catch (error) {
        console.error('Lỗi:', error);
        showToast('Không thể kết nối đến máy chủ', 'error');
      }
    });
  }

  // 2. Hàm tạo giao diện HTML cho bình luận mới (Khớp với EJS của bạn)
  function createCommentHTML(c) {
    const date = new Date(c.createdAt).toLocaleDateString('vi-VN');
    const avatarHTML = c.avatar 
      ? `<img src="${c.avatar}" alt="" class="c-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="c-avatar-init" style="display:none">${c.username.charAt(0).toUpperCase()}</div>`
      : `<div class="c-avatar-init">${c.username.charAt(0).toUpperCase()}</div>`;

    return `
      <div class="comment-item" id="cmt-${c.id}">
        <div class="comment-meta">
          ${avatarHTML}
          <span class="c-username">${c.username}</span>
          <span class="c-date">${date}</span>
        </div>
        <p class="c-content">${c.content}</p>
        <div class="c-actions">
          <button class="c-action-btn" onclick="toggleReply(${c.id})">Trả lời</button>
          <button class="c-action-btn" onclick="openReport(${c.id})">Báo cáo</button>
        </div>
        <!-- Vùng chứa form trả lời (ẩn mặc định) -->
        <div class="reply-form-area" id="reply-${c.id}">
            <form action="/learn/${window.LEARN_CONFIG.courseId}/${window.LEARN_CONFIG.lessonId}/comments" method="POST" onsubmit="submitReply(event, ${c.id})">
              <input type="hidden" name="parentId" value="${c.id}">
              <textarea name="content" placeholder="Viết câu trả lời..." rows="2"></textarea>
              <button type="submit" class="reply-post-btn">Gửi</button>
            </form>
        </div>
      </div>
    `;
  }
});

// Hàm hiển thị form trả lời (đã được gọi trong EJS)
window.toggleReply = function(commentId) {
  const replyForm = document.getElementById(`reply-${commentId}`);
  if (replyForm.style.display === 'block') {
    replyForm.style.display = 'none';
  } else {
    replyForm.style.display = 'block';
    replyForm.querySelector('textarea').focus();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('comment-form');
  const commentTextarea = document.getElementById('comment-textarea');
  const submitBtn = document.getElementById('submit-comment');
  const cancelBtn = document.getElementById('cancel-comment');

  if (commentTextarea) {
    // 1. Tự động giãn chiều cao textarea khi gõ (Auto-resize)
    commentTextarea.addEventListener('input', function() {
      this.style.height = 'auto'; // Reset chiều cao
      this.style.height = (this.scrollHeight) + 'px'; // Kéo dài bằng nội dung thật
      
      // Bật/tắt nút submit dựa vào việc có chữ hay không
      if (this.value.trim().length > 0) {
        submitBtn.removeAttribute('disabled');
      } else {
        submitBtn.setAttribute('disabled', 'true');
      }
    });

    // 2. Hiện cụm nút bấm khi click vào ô nhập
    commentTextarea.addEventListener('focus', () => {
      commentForm.classList.add('is-active');
    });

    // 3. Xử lý nút Hủy
    cancelBtn.addEventListener('click', () => {
      commentTextarea.value = ''; // Xóa chữ
      commentTextarea.style.height = 'auto'; // Thu nhỏ về ban đầu
      submitBtn.setAttribute('disabled', 'true'); // Khóa nút gửi
      commentForm.classList.remove('is-active'); // Ẩn cụm nút
    });
  }
});

// Bổ sung hàm submitReply vào global window object để gọi được từ inline HTML
window.submitReply = async function(event, parentId) {
  event.preventDefault(); 
  
  const form = event.target;
  const textarea = form.querySelector('textarea[name="content"]');
  const content = textarea.value.trim();
  const url = form.getAttribute('action');

  if (!content) return showToast('Vui lòng nhập nội dung trả lời!', 'error');

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ content: content, parentId: parentId }) 
    });

    const data = await response.json();

    if (data.success) {
      const newReplyHTML = createReplyHTML(data.comment);
      const parentCommentDiv = document.getElementById(`cmt-${parentId}`);
      
      // LƯU Ý: Dùng :scope > .replies-list để chỉ lấy thẻ chứa reply trực tiếp của comment này
      let repliesListDiv = parentCommentDiv.querySelector(':scope > .replies-list');
      
      if (!repliesListDiv) {
        repliesListDiv = document.createElement('div');
        repliesListDiv.className = 'replies-list';
        // Nếu cha là comment con, thụt vào ít thôi (15px), nếu là cha gốc thì thụt 40px
        repliesListDiv.style.marginLeft = parentCommentDiv.classList.contains('child-comment') ? '15px' : '40px';
        repliesListDiv.style.marginTop = '15px';
        repliesListDiv.style.borderLeft = '2px solid #1e293b';
        repliesListDiv.style.paddingLeft = '15px';
        parentCommentDiv.appendChild(repliesListDiv);
      }

      repliesListDiv.insertAdjacentHTML('beforeend', newReplyHTML);

      form.reset();
      window.toggleReply(parentId); 
      showToast('Đã gửi câu trả lời!', 'success');
    } else {
      showToast(data.message || 'Lỗi khi gửi trả lời', 'error');
    }
  } catch (error) {
    console.error('Lỗi:', error);
    showToast('Không thể kết nối đến máy chủ', 'error');
  } finally {
    submitBtn.disabled = false;
  }
};

// Hàm phụ để build HTML riêng cho Reply (vì giao diện Reply thường không có nút "Trả lời" tiếp theo)
function createReplyHTML(c) {
  const date = new Date(c.createdAt).toLocaleDateString('vi-VN');
  const avatarHTML = c.avatar 
    ? `<img src="${c.avatar}" alt="" class="c-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="c-avatar-init" style="display:none">${c.username.charAt(0).toUpperCase()}</div>`
    : `<div class="c-avatar-init">${c.username.charAt(0).toUpperCase()}</div>`;

  return `
    <div class="comment-item child-comment" id="cmt-${c.id}">
      <div class="comment-meta">
        ${avatarHTML}
        <span class="c-username">${c.username}</span>
        <span class="c-date">${date}</span>
      </div>
      <p class="c-content">${c.content}</p>
      
      <div class="c-actions">
        <button class="c-action-btn" onclick="toggleReply('${c.id}')">Trả lời</button>
        <!-- Thêm nút Xóa vì bình luận này do chính user hiện tại vừa tạo -->
        <button class="c-action-btn" style="color: #ef4444;" onclick="deleteComment('${c.id}')">Xóa</button>
        <button class="c-action-btn" onclick="openReport('${c.id}')">Báo cáo</button>
      </div>
      
      <div class="reply-form-area" id="reply-${c.id}" style="display:none; margin-top: 10px;">
        <form action="/learn/${window.LEARN_CONFIG.courseId}/${window.LEARN_CONFIG.lessonId}/comments" method="POST" onsubmit="submitReply(event, '${c.id}')">
          <input type="hidden" name="parentId" value="${c.id}">
          <textarea name="content" placeholder="Phản hồi đến ${c.username}..." rows="2" style="width: 100%; padding: 8px; border-radius: 6px;"></textarea>
          <div style="margin-top: 8px; text-align: right;">
            <button type="submit" class="reply-post-btn">Gửi câu trả lời</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

window.deleteComment = async function(commentId) {
  if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

  try {
    // Gọi API DELETE
    const response = await fetch(`/learn/${CFG.courseId}/${CFG.lessonId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      const cmtDiv = document.getElementById(`cmt-${commentId}`);
      if (cmtDiv) {
        // Thay vì xóa hẳn DOM (làm mất comment con), ta đổi giao diện sang trạng thái "Đã xóa"
        const contentP = cmtDiv.querySelector(':scope > .c-content');
        const actionsDiv = cmtDiv.querySelector(':scope > .c-actions');

        if (contentP) {
          contentP.className = 'c-deleted';
          contentP.textContent = '[Bình luận đã bị xóa]';
        }
        
        // Ẩn cụm nút Trả lời / Xóa / Báo cáo đi
        if (actionsDiv) {
          actionsDiv.style.display = 'none'; 
        }

        showToast('Đã xóa bình luận', 'success');
      }
    } else {
      showToast(data.message || 'Lỗi khi xóa bình luận', 'error');
    }
  } catch (error) {
    console.error('Lỗi:', error);
    showToast('Không thể kết nối đến máy chủ', 'error');
  }
};