const unitDto = {
  unitView: (unit) => {
    if (!unit) return null;
    
    const statusConfig = {
      "active": { text: "Đang hoạt động", bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100", dotClass: "bg-emerald-500 animate-pulse" },
      "hidden": { text: "Ẩn", bgClass: "bg-gray-50 text-gray-600 border-gray-200", dotClass: "bg-gray-400" },
      "locked": { text: "Khóa", bgClass: "bg-amber-50 text-amber-600 border-amber-100", dotClass: "bg-amber-500" }
    };

    return {
      id: unit.id,
      name: unit.name,
      status: statusConfig[unit.status] || statusConfig["hidden"],
      createdAt: new Date(unit.createdAt).toLocaleString('vi-VN'),
      deletedAt: unit.deletedAt ? new Date(unit.deletedAt).toLocaleString('vi-VN') : null,
      lessons: unit.lessonCount || 0
    };
  },

  unitListView: (units) => {
    return units.map(unit => unitDto.unitView(unit));
  }
};

export default unitDto;
