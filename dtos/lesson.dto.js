const lessonDto = {
  lessonView: (lesson, isTrash = false) => {
    if (!lesson) return null;
    
    const statusConfig = {
      "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
      "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
      "locked": { text: "Khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
    };

    return {
      id: lesson.id,
      name: lesson.name,
      status: lesson.status,
      statusDisplay: statusConfig[lesson.status] || statusConfig["hidden"],
      createdAt: new Date(lesson.createdAt).toLocaleString('vi-VN'),
      deletedAt: lesson.deletedAt ? new Date(lesson.deletedAt).toLocaleString('vi-VN') : null,
      isTrash: isTrash
    };
  }
};

export default lessonDto;
