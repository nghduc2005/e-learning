// Bảng màu gradient cho banner tự sinh
const BANNER_GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#ffecd2', '#fcb69f'],
  ['#96fbc4', '#f9f586'],
  ['#89f7fe', '#66a6ff'],
  ['#fddb92', '#d1fdff'],
];

// Sinh SVG banner từ tên khóa học
const generateBannerSvg = (name) => {
  // Chọn màu dựa trên hash của tên để cùng tên luôn ra cùng màu
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const [c1, c2] = BANNER_GRADIENTS[Math.abs(hash) % BANNER_GRADIENTS.length];

  // Wrap text thành max 2 dòng, mỗi dòng ~24 ký tự
  const words = name.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 24 && line) { lines.push(line); line = w; }
    else { line = (line + ' ' + w).trim(); }
    if (lines.length === 1) { lines.push(line); break; }
  }
  if (lines.length === 0) lines.push(line);

  const textEls = lines.map((l, i) =>
    `<text x="400" y="${lines.length === 1 ? 140 : 120 + i * 50}" font-family="'Segoe UI',Arial,sans-serif" font-size="36" font-weight="700" fill="white" text-anchor="middle" opacity="0.95">${l}</text>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="280" viewBox="0 0 800 280">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="800" height="280" fill="url(#bg)" rx="0"/>
    <circle cx="650" cy="50" r="120" fill="white" opacity="0.06"/>
    <circle cx="100" cy="230" r="90" fill="white" opacity="0.06"/>
    <rect x="0" y="0" width="800" height="280" fill="rgba(0,0,0,0.10)" rx="0"/>
    ${textEls}
  </svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
};

export const courseDto = {
  courseView: (course) => {
    if (!course) return null;
    
    const statusConfig = {
      "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
      "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
      "locked": { text: "Đã khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
    };

    return {
      id: course.id,
      name: course.name,
      banner: course.banner || generateBannerSvg(course.name),
      status: statusConfig[course.status] || statusConfig["hidden"],
      createdAt: new Date(course.createdAt).toLocaleString('vi-VN'),
      updatedAt: course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : null,
      deletedAt: course.deletedAt ? new Date(course.deletedAt).toLocaleString('vi-VN') : null,
      students: course.studentCount || 0
    };
  },

  courseListView: (courses) => {
    return courses.map(course => courseDto.courseView(course));
  }
};

