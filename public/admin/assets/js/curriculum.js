
function toSlug(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD") // Chuẩn hóa Unicode để tách dấu ra khỏi chữ
        .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu
        .replace(/đ/g, "d").replace(/Đ/g, "D") // Đổi chữ đ
        .replace(/[^a-z0-9\s]/g, "") // Xóa ký tự đặc biệt
        .replace(/\s+/g, " ") // Rút gọn khoảng trắng
        .trim();
}

function getCourseIdFromURL() {
    const pathParts = window.location.pathname.split('/');
    const courseIndex = pathParts.indexOf('course');
    return courseIndex !== -1 ? pathParts[courseIndex + 1] : null;
}

function getStatusBadgeHtml(status) {
    if (status === 'active') return '<span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded-full">Đang hoạt động</span>';
    if (status === 'locked') return '<span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 rounded-full">Khóa</span>';
    if (status === 'hidden') return '<span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 rounded-full">Ẩn</span>';
    return '';
}

let availableUnits = [];
let availableLessons = [];

function getCurrentUnitIds() {
    return Array.from(document.querySelectorAll('.unit-item')).map(u => u.getAttribute('data-id'));
}
function getCurrentLessonIds() {
    return Array.from(document.querySelectorAll('.lesson-item')).map(l => l.getAttribute('data-id'));
}

async function fetchCurriculumData() {
    const loadingState = document.getElementById('loading-state');

    try {
        const courseId = getCourseIdFromURL();
        const [unitsRes, lessonsRes, currentDataRes] = await Promise.all([
            fetch('/admin/course/units'),
            fetch('/admin/course/lessons'),
            fetch(`/admin/course/${courseId}/curriculum/data`)
        ]);
        if (!unitsRes.ok || !lessonsRes.ok) {
            throw new Error("Không thể tải dữ liệu từ server");
        }

        const unitsData = await unitsRes.json();
        const lessonsData = await lessonsRes.json();
        const currentData = currentDataRes.ok ? await currentDataRes.json() : [];

        // Gán dữ liệu vào mảng và tự động thêm thuộc tính slug để phục vụ tìm kiếm
        availableUnits = unitsData.map(item => ({ ...item, slug: toSlug(item.name) }));
        availableLessons = lessonsData.map(item => ({ ...item, slug: toSlug(item.name) }));

        if (loadingState) {
            loadingState.classList.add('hidden');
        }

        if (currentData && currentData.length > 0) {
            renderCurrentCurriculum(currentData);
        } else {
            updateIndexes(); // trigger empty state
        }

    } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
        updateIndexes(); // Show fallback empty state
    }
}

function renderCurrentCurriculum(data) {
    if (!data || data.length === 0) return;
    const unitsEl = document.getElementById('units-container');
    if (!unitsEl) return;

    let html = '';
    data.forEach(unit => {
        html += `
          <div class="unit-item group border border-gray-100 bg-white rounded-2xl shadow-sm mt-4" data-id="${unit.id}">
              <div class="flex items-center justify-between p-5 bg-gray-50/50 cursor-pointer unit-header">
                  <div class="flex items-center space-x-4">
                      <svg class="w-5 h-5 text-gray-300 drag-handle cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
                      <div class="unit-number flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm"></div>
                      <div>
                          <h3 class="font-bold text-gray-900 flex items-center">${unit.title} ${getStatusBadgeHtml(unit.status)}</h3>
                          <p class="text-xs text-gray-500">${unit.lessons ? unit.lessons.length : 0} bài học</p>
                      </div>
                  </div>
                  <div class="flex items-center space-x-2">
                      <button type="button" class="change-unit-btn p-2 text-gray-400 hover:text-green-600 transition-colors" title="Thay đổi chương"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></button>
                      <a href="/admin/unit/edit/${unit.id}" target="_blank" rel="opener" onclick="event.stopPropagation();" class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></a>
                      <button type="button" onclick="event.stopPropagation(); if(confirm('Xóa chương này?')) { this.closest('.unit-item').remove(); updateIndexes(); }" class="p-2 text-gray-400 hover:text-red-600 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
              </div>

              <div class="lessons-container p-4 space-y-2 border-t border-gray-50">
        `;

        if (unit.lessons && unit.lessons.length > 0) {
            unit.lessons.forEach(lesson => {
                html += `
                    <div class="lesson-item flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group/item" data-id="${lesson.id}"> 
                        <div class="flex items-center space-x-3">
                            <div>
                                <span class="lesson-title text-sm font-medium text-gray-700"></span>
                                <span class="lesson-name-text text-sm font-medium text-gray-700">${lesson.title}</span>
                                ${getStatusBadgeHtml(lesson.status)}
                            </div>
                        </div>
                        <div class="opacity-0 group-hover/item:opacity-100 transition-all flex items-center space-x-3">
                            <a href="/admin/lesson/edit/${lesson.id}" target="_blank" rel="opener" onclick="event.stopPropagation();" class="text-xs text-indigo-600 font-bold hover:underline">Sửa bài</a>
                            <button type="button" onclick="event.stopPropagation(); if(confirm('Xóa bài học này?')) { this.closest('.lesson-item').remove(); updateIndexes(); }" class="text-xs text-red-600 font-bold hover:underline">Xóa</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `
                  <button type="button" class="add-lesson-btn w-full py-2 mt-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all">
                      + Thêm bài học mới
                  </button>
              </div>
          </div>
        `;
    });

    unitsEl.innerHTML = html;

    // Sortable for newly added lessons container is handled in the general update loop or globally, but we should attach them
    document.querySelectorAll('.lessons-container').forEach(lessonList => {
        // Skip if already has sortable (this is a simple way, Sortable checks this but to be safe)
        if (lessonList.children.length > 0 && !lessonList.sortable) {
            new Sortable(lessonList, {
                group: 'lessons',
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'bg-indigo-50',
                onEnd: updateIndexes
            });
        }
    });

    updateIndexes();
}

fetchCurriculumData();

const unitsEl = document.getElementById('units-container');

function updateIndexes() {
    const units = document.querySelectorAll('.unit-item');
    const actionWrapper = document.getElementById('action-buttons-wrapper');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');

    // Make sure empty-state is not shown while loading
    if (loadingState && !loadingState.classList.contains('hidden')) {
        if (emptyState) emptyState.classList.add('hidden');
        if (actionWrapper) actionWrapper.classList.add('hidden');
    } else {
        if (actionWrapper) actionWrapper.classList.remove('hidden');
        if (units.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
        }
    }
    units.forEach((unit, cIdx) => {
        // Fix lỗi giao diện che dropdown của bài học
        unit.classList.remove('overflow-hidden');

        const unitNum = cIdx + 1;
        const numEl = unit.querySelector('.unit-number');
        if (numEl) numEl.innerText = unitNum;

        const lessons = unit.querySelectorAll('.lesson-item');
        lessons.forEach((lesson, lIdx) => {
            const lessonNum = lIdx + 1;
            const titleEl = lesson.querySelector('.lesson-title');
            if (titleEl) titleEl.innerText = `${unitNum}.${lessonNum}`;
        });

        const lessonCountEl = unit.querySelector('.unit-header p');
        if (lessonCountEl) {
            lessonCountEl.innerText = `${lessons.length} bài học`;
        }

        const addBtn = unit.querySelector('.add-lesson-btn');
        if (addBtn) addBtn.innerText = `+ Thêm bài học mới vào chương ${unitNum}`;
    });

    if (actionWrapper && loadingState && loadingState.classList.contains('hidden')) {
        actionWrapper.classList.remove('hidden');
    }
}

if (unitsEl) {
    updateIndexes(); // Chạy 1 lần lúc load trang để xóa class overflow-hidden

    new Sortable(unitsEl, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'bg-indigo-50',
        onEnd: updateIndexes
    });

    document.querySelectorAll('.lessons-container').forEach(lessonList => {
        new Sortable(lessonList, {
            group: 'lessons',
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'bg-indigo-50',
            onEnd: updateIndexes
        });
    });

    unitsEl.addEventListener('click', function (e) {
        // A. Đóng/mở Chương
        const header = e.target.closest('.unit-header');
        if (header && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('input') && !e.target.closest('.unit-search-wrapper')) {
            const content = header.nextElementSibling;
            if (content) content.classList.toggle('hidden');
        }

        // B. Bấm nút "Thêm bài học" -> Hiển thị ô tìm kiếm
        const addLessonBtn = e.target.closest('.add-lesson-btn');
        if (addLessonBtn) {
            addLessonBtn.classList.add('hidden');

            const searchUI = document.createElement('div');
            searchUI.className = 'lesson-search-wrapper relative mt-2';
            searchUI.innerHTML = `
                <input type="text" class="w-full bg-white border-2 border-indigo-100 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 outline-none shadow-sm transition-all" placeholder="Gõ tên bài học để tìm..." autofocus>
                <div class="lesson-search-dropdown absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50 hidden"></div>
            `;

            addLessonBtn.insertAdjacentElement('beforebegin', searchUI);
            const input = searchUI.querySelector('input');
            const dropdown = searchUI.querySelector('.lesson-search-dropdown');

            setTimeout(() => input.focus(), 50);

            // Xử lý khi gõ phím (Lọc kết quả bằng Slug)
            input.addEventListener('input', function () {
                const querySlug = toSlug(this.value);

                // Nếu ô input rỗng thì ẩn dropdown
                if (!querySlug) {
                    dropdown.classList.add('hidden');
                    return;
                }

                const filtered = availableLessons.filter(l => l.slug.includes(querySlug));
                const currentLessonIds = getCurrentLessonIds();

                let html = '';
                if (filtered.length > 0) {
                    html += filtered.map(l => {
                        const isExists = currentLessonIds.includes(l.id.toString());
                        const disabledClass = isExists ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-indigo-50 cursor-pointer transition-colors';
                        const disabledAttr = isExists ? '' : `data-id="${l.id}" data-title="${l.name || l.title}" data-status="${l.status || 'hidden'}"`;
                        const existsBadge = isExists ? '<span class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-2">Đã thêm</span>' : '';
                        return `
                        <div class="p-3 text-sm text-gray-700 border-b border-gray-50 flex justify-between items-center ${disabledClass}" ${disabledAttr}>
                            <span><span class="font-medium">${l.name || l.title}</span> ${existsBadge}</span>
                            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">${l.type || 'Bài học'}</span>
                        </div>
                    `}).join('');
                } else {
                    html = `<div class="p-3 text-sm text-gray-500 text-center italic border-b border-gray-50">Không tìm thấy bài học phù hợp</div>`;
                }

                html += `
                    <a href="/admin/lesson/create" target="_blank" rel="opener" class="block w-full p-3 text-center text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                        + Tạo bài học mới
                    </a>
                `;

                dropdown.classList.remove('hidden');
                dropdown.innerHTML = html;
            });

            // Xử lý khi click chọn bài học từ Dropdown
            dropdown.addEventListener('click', function (evt) {
                const item = evt.target.closest('div[data-title]');
                if (item) {
                    const lessonTitle = item.getAttribute('data-title');
                    const lessonId = item.getAttribute('data-id'); // LẤY ID TỪ ĐÂY
                    const lessonStatus = item.getAttribute('data-status');

                    const lessonHTML = `
                        <div class="lesson-item flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group/item" 
                            data-id="${lessonId}"> <div class="flex items-center space-x-3">
                                <div>
                                    <span class="lesson-title text-sm font-medium text-gray-700"></span>
                                    <span class="lesson-name-text text-sm font-medium text-gray-700">${lessonTitle}</span>
                                    ${getStatusBadgeHtml(lessonStatus)}
                                </div>
                            </div>
                            <div class="opacity-0 group-hover/item:opacity-100 transition-all flex items-center space-x-3">
                                <a href="/admin/lesson/edit/${lessonId}" target="_blank" rel="opener" onclick="event.stopPropagation();" class="text-xs text-indigo-600 font-bold hover:underline">Sửa bài</a>
                                <button type="button" onclick="event.stopPropagation(); if(confirm('Xóa bài học này?')) { this.closest('.lesson-item').remove(); updateIndexes(); }" class="text-xs text-red-600 font-bold hover:underline">Xóa</button>
                            </div>
                        </div>
                        `;

                    searchUI.insertAdjacentHTML('beforebegin', lessonHTML);
                    searchUI.remove();
                    addLessonBtn.classList.remove('hidden');
                    updateIndexes();
                }
            });

            // Hủy tìm kiếm nếu click ra ngoài
            document.addEventListener('click', function closeSearch(evt) {
                if (!searchUI.contains(evt.target) && evt.target !== addLessonBtn) {
                    searchUI.remove();
                    addLessonBtn.classList.remove('hidden');
                    document.removeEventListener('click', closeSearch);
                }
            });
        }

        // C. Bấm nút "Đổi chương" -> Hiển thị ô tìm kiếm thay thế chương
        const changeUnitBtn = e.target.closest('.change-unit-btn');
        if (changeUnitBtn) {
            e.stopPropagation();
            const unitHeader = changeUnitBtn.closest('.unit-header');
            const unitItem = changeUnitBtn.closest('.unit-item');
            
            const titleEl = unitHeader.querySelector('h3');
            
            if (unitHeader.querySelector('.unit-search-wrapper')) return;

            const searchUI = document.createElement('div');
            searchUI.className = 'unit-search-wrapper relative mt-1 w-64';
            searchUI.innerHTML = `
                <input type="text" class="w-full bg-white border-2 border-indigo-100 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none shadow-sm transition-all" placeholder="Gõ tên chương để thay thế..." autofocus>
                <div class="unit-change-dropdown absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50 hidden"></div>
            `;
            
            titleEl.style.display = 'none';
            titleEl.insertAdjacentElement('afterend', searchUI);
            
            const input = searchUI.querySelector('input');
            const dropdown = searchUI.querySelector('.unit-change-dropdown');

            setTimeout(() => input.focus(), 50);

            input.addEventListener('input', function() {
                const querySlug = toSlug(this.value);
                if (!querySlug) {
                    dropdown.classList.add('hidden');
                    return;
                }

                const filtered = availableUnits.filter(c => c.slug.includes(querySlug));
                const currentUnitIds = getCurrentUnitIds();
                
                let html = '';
                if (filtered.length > 0) {
                    html += filtered.map(c => {
                        const isExists = currentUnitIds.includes(c.id.toString());
                        const disabledClass = isExists ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100 cursor-pointer transition-colors';
                        const disabledAttr = isExists ? '' : `data-id="${c.id}" data-title="${c.name || c.title}" data-status="${c.status || 'hidden'}"`;
                        const existsBadge = isExists ? '<span class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-2">Đã thêm</span>' : '';
                        return `
                        <div class="p-3 rounded-lg text-sm text-gray-800 font-medium border-b border-gray-50 flex justify-between items-center ${disabledClass}" ${disabledAttr}>
                            <span>${c.name || c.title} ${existsBadge}</span>
                        </div>
                    `}).join('');
                } else {
                    html = `<div class="p-3 text-sm text-gray-500 text-center italic border-b border-gray-50">Không tìm thấy chương phù hợp</div>`;
                }

                dropdown.classList.remove('hidden');
                dropdown.innerHTML = html;
            });

            dropdown.addEventListener('click', function(evt) {
                evt.stopPropagation();
                const item = evt.target.closest('div[data-title]');
                if (item) {
                    const newUnitId = item.getAttribute('data-id');
                    const newUnitTitle = item.getAttribute('data-title');
                    const newUnitStatus = item.getAttribute('data-status');
                    
                    unitItem.setAttribute('data-id', newUnitId);
                    
                    const editLink = unitHeader.querySelector('a[href^="/admin/unit/edit/"]');
                    if (editLink) editLink.setAttribute('href', `/admin/unit/edit/${newUnitId}`);
                    
                    titleEl.innerHTML = `${newUnitTitle} ${getStatusBadgeHtml(newUnitStatus)}`;
                    
                    searchUI.remove();
                    titleEl.style.display = '';
                }
            });

            document.addEventListener('click', function closeSearch(evt) {
                if (!searchUI.contains(evt.target) && !changeUnitBtn.contains(evt.target)) {
                    searchUI.remove();
                    titleEl.style.display = '';
                    document.removeEventListener('click', closeSearch);
                }
            });
        }
    });
}

const addUnitBtn = document.getElementById('add-unit-btn');
const unitDropdown = document.getElementById('unit-search-dropdown');
const unitInput = document.getElementById('unit-search-input');
const unitResults = document.getElementById('unit-search-results');
const unitWrapper = document.getElementById('unit-add-wrapper');

if (addUnitBtn && unitDropdown) {
    addUnitBtn.addEventListener('click', function () {
        unitDropdown.classList.toggle('hidden');
        if (!unitDropdown.classList.contains('hidden')) {
            unitInput.value = '';
            unitResults.innerHTML = '';
            unitInput.focus();
        }
    });

    // Lọc dữ liệu chương bằng Slug
    unitInput.addEventListener('input', function () {
        const querySlug = toSlug(this.value);

        if (!querySlug) {
            unitResults.innerHTML = '';
            return;
        }

        const filtered = availableUnits.filter(c => c.slug.includes(querySlug));
        const currentUnitIds = getCurrentUnitIds();

        let html = '';
        if (filtered.length > 0) {
            html += filtered.map(c => {
                const isExists = currentUnitIds.includes(c.id.toString());
                const disabledClass = isExists ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100 cursor-pointer transition-colors';
                const disabledAttr = isExists ? '' : `data-id="${c.id}" data-title="${c.name || c.title}" data-status="${c.status || 'hidden'}"`;
                const existsBadge = isExists ? '<span class="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-2">Đã thêm</span>' : '';
                return `
              <div class="p-3 rounded-lg text-sm text-gray-800 font-medium border-b border-gray-50 flex justify-between items-center ${disabledClass}" ${disabledAttr}>
                  <span>${c.name || c.title} ${existsBadge}</span>
              </div>
          `}).join('');
        } else {
            html = `<div class="p-3 text-sm text-gray-500 text-center italic border-b border-gray-50">Không tìm thấy chương phù hợp</div>`;
        }

        html += `
            <a href="/admin/unit/create" target="_blank" rel="opener" class="block w-full p-3 text-center text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors rounded-b-lg">
                + Tạo chương mới
            </a>
        `;

        unitResults.innerHTML = html;
    });

    // Chọn & Thêm chương
    unitResults.addEventListener('click', function (evt) {
        const item = evt.target.closest('div[data-title]');
        if (item) {
            const unitTitle = item.getAttribute('data-title');
            const unitId = item.getAttribute('data-id');
            const unitStatus = item.getAttribute('data-status');
            const unitHTML = `
              <div class="unit-item group border border-gray-100 bg-white rounded-2xl shadow-sm mt-4" data-id="${unitId}">
                  <div class="flex items-center justify-between p-5 bg-gray-50/50 cursor-pointer unit-header">
                      <div class="flex items-center space-x-4">
                          <svg class="w-5 h-5 text-gray-300 drag-handle cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
                          <div class="unit-number flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm"></div>
                          <div>
                              <h3 class="font-bold text-gray-900 flex items-center">${unitTitle} ${getStatusBadgeHtml(unitStatus)}</h3>
                              <p class="text-xs text-gray-500">0 bài học</p>
                          </div>
                      </div>
                      <div class="flex items-center space-x-2">
                          <button type="button" class="change-unit-btn p-2 text-gray-400 hover:text-green-600 transition-colors" title="Thay đổi chương"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></button>
                          <a href="/admin/unit/edit/${unitId}" target="_blank" rel="opener" onclick="event.stopPropagation();" class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></a>
                          <button type="button" onclick="event.stopPropagation(); if(confirm('Xóa chương này?')) { this.closest('.unit-item').remove(); updateIndexes(); }" class="p-2 text-gray-400 hover:text-red-600 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </div>
                  </div>
    
                  <div class="lessons-container p-4 space-y-2 border-t border-gray-50">
                      <button type="button" class="add-lesson-btn w-full py-2 mt-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all">
                          + Thêm bài học mới
                      </button>
                  </div>
              </div>
            `;

            unitsEl.insertAdjacentHTML('beforeend', unitHTML);

            const newUnitEl = unitsEl.lastElementChild;
            const newLessonsContainer = newUnitEl.querySelector('.lessons-container');
            new Sortable(newLessonsContainer, {
                group: 'lessons',
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'bg-indigo-50',
                onEnd: updateIndexes
            });

            updateIndexes();
            unitDropdown.classList.add('hidden');
        }
    });

    document.addEventListener('click', function (evt) {
        if (!unitWrapper.contains(evt.target)) {
            unitDropdown.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {

    const curriculumForm = document.getElementById('curriculum-form');

    if (curriculumForm) {
        curriculumForm.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
        curriculumForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveCurriculum();
        });
    }
});

function getCurriculumData() {
    const units = [];
    const unitElements = document.querySelectorAll('.unit-item');

    unitElements.forEach((unitEl, index) => {
        // Lấy ID và tiêu đề chương (thẻ h3)
        const unitId = unitEl.getAttribute('data-id');
        const titleEl = unitEl.querySelector('h3.font-bold.text-gray-900');
        const unitTitle = titleEl ? titleEl.innerText.trim() : '';

        const lessons = [];
        const lessonElements = unitEl.querySelectorAll('.lesson-item');

        lessonElements.forEach((lessonEl, lIndex) => {
            // Lấy ID và tiêu đề bài học (thẻ span.lesson-name-text)
            const lessonId = lessonEl.getAttribute('data-id');
            const lessonNameEl = lessonEl.querySelector('.lesson-name-text');
            const lessonTitle = lessonNameEl ? lessonNameEl.innerText.trim() : '';

            lessons.push({
                id: lessonId,
                title: lessonTitle,
                order: lIndex + 1
            });
        });

        units.push({
            id: unitId,
            title: unitTitle,
            order: index + 1, // Thứ tự chương
            lessons: lessons
        });
    });

    return units;
}

async function saveCurriculum() {
    const courseId = getCourseIdFromURL();
    if (!courseId) {
        alert("Lỗi: Không tìm thấy ID khóa học.");
        return;
    }
    const curriculumData = getCurriculumData();

    const submitBtn = document.querySelector('button[type="submit"][form="curriculum-form"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Lưu chương trình học';

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            // Thay đổi trạng thái hiển thị loading UI
            submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
            `;
        }

        const response = await fetch(`/admin/course/${courseId}/curriculum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ curriculum: curriculumData })
        });

        const result = await response.json();
        console.log(result);

        if (!response.ok) throw new Error(result.message || 'Có lỗi xảy ra khi lưu');

        alert('Lưu cấu trúc khóa học thành công!');

    } catch (error) {
        console.error('Error saving curriculum:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText; // Trả lại giao diện nút ban đầu
        }
    }
}