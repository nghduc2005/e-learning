import { reviewModel } from "../models/review.model.js";

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const reviewService = {
  getReviewsByCourseId: async (courseId) => {
    const rows = await reviewModel.findByCourseId(courseId);
    return rows.map(r => ({
      id: r.id,
      content: r.content || '',
      ratingNum: r.ratingNum,
      createdAt: formatDate(r.createdAt),
      userId: r.userId,
      username: r.username,
      avatar: r.avatar || null,
    }));
  },

  deleteReview: async (reviewId) => reviewModel.hardDelete(reviewId),
};

export default reviewService;
