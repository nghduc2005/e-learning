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
      status: statusConfig[course.status] || statusConfig["hidden"],
      createdAt: new Date(course.createdAt).toLocaleString('vi-VN'),
      deletedAt: course.deletedAt ? new Date(course.deletedAt).toLocaleString('vi-VN') : null,
      students: course.studentCount || 0
    };
  },

  courseListView: (courses) => {
    return courses.map(course => courseDto.courseView(course));
  }
};
